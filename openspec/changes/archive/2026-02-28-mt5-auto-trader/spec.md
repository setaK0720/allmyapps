# Spec: MT5 Auto Trader

## 概要

スキャルピング自動売買システム。Python Trading Engine が MT5 と直接通信して戦略を実行し、TypeScript バックエンド（mt5-service）がデータ永続化と UI 制御を担う。**発注判断は Python Engine 内で完結**し、TypeScript はモニタリングと制御のみを行う。

---

## システム構成

```
Windows ホスト
├── MT5 Terminal（常時起動）
└── trading-engine/ (Python)
    ├── MT5 と直接通信（MetaTrader5 ライブラリ）
    ├── マルチ戦略並列実行
    └── WebSocket/REST サーバー（ポート 8765）

WSL2
├── services/mt5-service/ (Hono, ポート 3001)
│   ├── PostgreSQL への永続化
│   ├── REST API（戦略設定・リスク設定・制御）
│   └── SSE（フロントへのリアルタイム配信）
└── apps/trading/ (Vite, ポート 5174)
    ├── ダッシュボード
    ├── 戦略管理 UI
    └── リスク制御パネル
```

---

## データモデル

### strategy_configs

```sql
id            SERIAL PRIMARY KEY
symbol        VARCHAR(20) NOT NULL    -- 例: "USDJPY"
timeframe     VARCHAR(10) NOT NULL    -- 例: "M1", "M5"
strategy_type VARCHAR(50) NOT NULL    -- 例: "scalp_ema"
params        JSONB NOT NULL DEFAULT '{}'
enabled       BOOLEAN NOT NULL DEFAULT false
created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
```

### risk_config（シングルレコード）

```sql
id                  INTEGER PRIMARY KEY DEFAULT 1
max_lot_per_trade   DECIMAL(10,2) NOT NULL DEFAULT 0.01
daily_loss_limit    DECIMAL(10,2) NOT NULL    -- USD
max_open_positions  INTEGER NOT NULL DEFAULT 3
emergency_stop      BOOLEAN NOT NULL DEFAULT false
updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
```

### trades（約定履歴）

```sql
id              SERIAL PRIMARY KEY
ticket          BIGINT UNIQUE NOT NULL     -- MT5 のチケット番号
symbol          VARCHAR(20) NOT NULL
strategy_id     INTEGER REFERENCES strategy_configs(id)
order_type      VARCHAR(10) NOT NULL       -- "BUY" | "SELL"
lot             DECIMAL(10,2) NOT NULL
open_price      DECIMAL(20,5) NOT NULL
close_price     DECIMAL(20,5)
open_time       TIMESTAMPTZ NOT NULL
close_time      TIMESTAMPTZ
profit          DECIMAL(10,2)
swap            DECIMAL(10,2)
commission      DECIMAL(10,2)
status          VARCHAR(10) NOT NULL DEFAULT 'open'  -- "open" | "closed"
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### positions（オープンポジション、キャッシュ）

```sql
ticket          BIGINT PRIMARY KEY
symbol          VARCHAR(20) NOT NULL
strategy_id     INTEGER REFERENCES strategy_configs(id)
order_type      VARCHAR(10) NOT NULL
lot             DECIMAL(10,2) NOT NULL
open_price      DECIMAL(20,5) NOT NULL
current_price   DECIMAL(20,5) NOT NULL
unrealized_pl   DECIMAL(10,2) NOT NULL
open_time       TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

## Python Trading Engine

### ファイル構成

```
trading-engine/
├── engine.py            # メインエントリーポイント・イベントループ
├── strategy_runner.py   # 戦略インスタンス管理・並列実行
├── bridge.py            # WebSocket サーバー + REST エンドポイント
├── risk.py              # ハードリミット検証
├── mt5_client.py        # MetaTrader5 ラッパー
├── strategies/
│   ├── base.py          # 戦略基底クラス
│   ├── scalp_ema.py     # EMA クロス戦略（サンプル）
│   └── scalp_rsi.py     # RSI 戦略（サンプル）
└── requirements.txt
```

### 戦略基底クラス（`strategies/base.py`）

```python
class BaseStrategy:
    def __init__(self, symbol: str, timeframe: int, params: dict): ...
    def on_tick(self, tick: dict) -> None: ...  # メインの判断ロジック
    def on_trade_event(self, event: dict) -> None: ...
    def should_buy(self) -> bool: ...
    def should_sell(self) -> bool: ...
    def should_close(self, position: dict) -> bool: ...
```

### WebSocket イベント（Engine → mt5-service）

```json
// Tick 更新
{"type": "tick", "symbol": "USDJPY", "bid": 149.50, "ask": 149.51, "time": "..."}

// 注文イベント
{"type": "order_opened", "ticket": 12345, "symbol": "USDJPY", "type": "BUY", "lot": 0.01, "price": 149.50, "strategy_id": 1}
{"type": "order_closed", "ticket": 12345, "profit": 150.0, "close_price": 149.65}

// エンジン状態
{"type": "engine_status", "running": true, "strategies": [...], "equity": 10000.0}

// リスクアラート
{"type": "risk_alert", "level": "warning", "message": "日次損失 80% に到達"}
```

### REST API（mt5-service → Engine）

```
POST /control/start       戦略を開始（strategy_id 指定）
POST /control/stop        戦略を停止（strategy_id 指定）
POST /control/close-all   全ポジション強制決済
POST /control/sync-config 最新の戦略設定を DB から再読み込み
GET  /status              エンジン稼働状態・全戦略ステータス
```

---

## mt5-service（Hono バックエンド）

### エンドポイント

```
# 戦略設定
GET    /api/strategies              一覧取得
POST   /api/strategies              新規作成
PATCH  /api/strategies/:id          更新（params, enabled など）
DELETE /api/strategies/:id          削除

# リスク設定
GET    /api/risk-config             取得
PATCH  /api/risk-config             更新

# 緊急制御
POST   /api/control/emergency-stop  全停止 + 全決済
POST   /api/control/pause           全戦略を一時停止（決済なし）
POST   /api/control/resume          一時停止を解除

# 約定履歴
GET    /api/trades?from=&to=&symbol=  フィルタ付き履歴
GET    /api/trades/stats              P&L 統計（日次・月次・戦略別）

# リアルタイム（SSE）
GET    /api/stream                  ポジション・P&L・アラートのストリーム
```

### Python Engine との連携フロー

```
mt5-service 起動
  → DB から戦略設定を読み込み
  → Python Engine の WebSocket に接続
  → イベント受信 → DB に永続化 → SSE でフロントに転送
  → フロントからの制御 → Python Engine の REST API を呼び出し
  → 設定変更時 → DB 更新後に Engine へ sync-config を通知
```

---

## リスク管理（二層構造）

### Layer 1: Python Engine（ハードリミット）

| 制御 | 動作 |
|------|------|
| ロット上限超過 | 発注をブロック |
| 戦略単体のドローダウン超過 | その戦略のみ自動停止 |
| 同一シンボルの重複ポジション | 発注をブロック |

### Layer 2: TypeScript 制御（ソフト制御）

| 制御 | 動作 |
|------|------|
| 日次損失上限到達 | Engine に PAUSE 送信（新規発注停止、既存ポジション保持） |
| 緊急停止ボタン | Engine に close-all → 全決済後に全戦略停止 |
| 特定戦略の無効化 | DB 更新 → Engine に sync-config |
| ロット上限変更 | DB 更新 → Engine に sync-config |

---

## apps/trading（React ダッシュボード）

### 画面構成

| 画面 | パス | 内容 |
|------|------|------|
| ダッシュボード | `/` | 口座残高・P&L・稼働中戦略数・緊急停止ボタン |
| ポジション | `/positions` | オープンポジション一覧（リアルタイム更新） |
| 戦略管理 | `/strategies` | 戦略の一覧・有効/無効・パラメータ編集 |
| リスク設定 | `/risk` | ロット上限・日次損失上限・最大ポジション数 |
| 約定履歴 | `/history` | フィルタ付き履歴・P&L グラフ |

### リアルタイム更新

- SSE（`/api/stream`）で P&L・ポジション・アラートを受信
- 緊急停止ボタンはヘッダーに常時表示

---

## 技術スタック

| コンポーネント | 技術 |
|--------------|------|
| trading-engine | Python 3.11+、MetaTrader5、fastapi、websockets、asyncio |
| mt5-service | Bun、Hono、Drizzle ORM、PostgreSQL |
| apps/trading | Vite + React 19 + TypeScript strict、@allmyapps/ui、Tailwind v4 |
| テスト | trading-engine: pytest、mt5-service: bun test |

---

## 非機能要件

- 戦略実行のクリティカルパスに TypeScript を介在させない
- Python Engine の WebSocket 再接続は自動リトライ（指数バックオフ）
- `any` 型禁止（TypeScript strict）
- 緊急停止は Engine 側でも常にローカル実行可能（mt5-service 停止中でも動作）
- 戦略パラメータの変更は即時反映（次の Tick から適用）

---

## スコープ外（将来対応）

- バックテスト機能
- ML ベースの戦略
- 複数ブローカー対応
- モバイルアプリ
- VPS 自動デプロイ
