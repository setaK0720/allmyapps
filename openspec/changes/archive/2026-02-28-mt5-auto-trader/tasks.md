# Tasks: MT5 Auto Trader

## Phase 1: trading-engine（Python、Windows で実行）

### MT5 接続基盤

- [x] `requirements.txt` を作成（MetaTrader5, fastapi, uvicorn, websockets, asyncio）
- [x] `mt5_client.py` を実装（MT5 接続・切断・Tick 取得・注文発注・ポジション照会のラッパー）
- [x] `engine.py` のメインループを実装（asyncio イベントループ、起動/停止ハンドリング）

### 戦略フレームワーク

- [x] `strategies/base.py` の `BaseStrategy` 基底クラスを実装
- [x] `strategy_runner.py` を実装（戦略インスタンスの登録・起動・停止・並列実行管理）
- [x] `strategies/scalp_ema.py` を実装（EMA クロスサンプル戦略）
- [x] `strategies/scalp_rsi.py` を実装（RSI サンプル戦略）

### リスク管理

- [x] `risk.py` のハードリミット検証を実装（ロット超過・ドローダウン・重複ポジション）
- [x] エンジン起動時に DB から risk_config を読み込む処理を実装

### WebSocket / REST ブリッジ

- [x] `bridge.py` の WebSocket サーバーを実装（tick・order・engine_status・risk_alert イベント配信）
- [x] `bridge.py` の REST エンドポイントを実装（/control/start, /stop, /close-all, /sync-config, /status）
- [x] pytest で mt5_client ラッパーのユニットテストを作成（モック使用）
- [x] pytest で risk.py のユニットテストを作成

## Phase 2: mt5-service（Hono バックエンド）

### セットアップ

- [x] `services/mt5-service/` を Bun + Hono で初期化（pnpm workspace / bun workspaces に追加）
- [x] Drizzle ORM + PostgreSQL を設定
- [x] `turbo.json` に mt5-service を追加

### DB スキーマ・マイグレーション

- [x] `strategy_configs` テーブルのスキーマ定義
- [x] `risk_config` テーブルのスキーマ定義
- [x] `trades` テーブルのスキーマ定義
- [x] `positions` テーブルのスキーマ定義
- [x] マイグレーションファイルを生成・適用

### Python Engine との連携

- [x] Python Engine の WebSocket に接続するクライアントを実装
- [x] 受信イベント（order_opened / order_closed）を DB に永続化する処理を実装
- [x] 受信イベントを SSE（`/api/stream`）でフロントに転送する処理を実装
- [x] WebSocket 切断時の自動再接続（指数バックオフ）を実装

### 戦略設定 API

- [x] `GET /api/strategies` を実装
- [x] `POST /api/strategies` を実装
- [x] `PATCH /api/strategies/:id` を実装（DB 更新 → Engine に sync-config 通知）
- [x] `DELETE /api/strategies/:id` を実装

### リスク設定・制御 API

- [x] `GET /api/risk-config` と `PATCH /api/risk-config` を実装
- [x] `POST /api/control/emergency-stop` を実装（Engine の close-all を呼び出し）
- [x] `POST /api/control/pause` と `/resume` を実装
- [x] 日次損失上限監視を実装（超過時に Engine へ PAUSE 送信）

### 約定履歴 API

- [x] `GET /api/trades` をフィルタ付きで実装（from・to・symbol・strategy_id）
- [x] `GET /api/trades/stats` を実装（日次・月次・戦略別 P&L）

### テスト

- [x] 戦略設定 CRUD のユニットテスト（bun test）
- [x] リスク設定更新のユニットテスト

## Phase 3: apps/trading（React ダッシュボード）

### セットアップ

- [x] `apps/trading/` を Vite + React 19 + TypeScript strict で初期化
- [x] React Router v7・Tailwind CSS v4・@allmyapps/ui を設定
- [x] mt5-service の OpenAPI 仕様から API クライアント型を生成

### 共通コンポーネント

- [x] ヘッダーに緊急停止ボタンを常時表示するレイアウトを実装
- [x] SSE 接続フック（`useStream`）を実装

### ダッシュボード画面（`/`）

- [x] 口座残高・本日 P&L・稼働中戦略数のサマリーカードを実装
- [x] オープンポジション一覧（SSE でリアルタイム更新）を実装

### ポジション画面（`/positions`）

- [x] ポジション詳細テーブル（銘柄・ロット・含み損益・戦略名）を実装
- [x] 個別ポジションの手動決済ボタンを実装

### 戦略管理画面（`/strategies`）

- [x] 戦略一覧テーブル（シンボル・タイムフレーム・タイプ・有効/無効）を実装
- [x] 戦略の有効/無効トグルを実装
- [x] パラメータ編集フォーム（JSON params を項目ごとに編集）を実装
- [x] 戦略の新規作成フォームを実装
- [x] 戦略の削除確認ダイアログを実装

### リスク設定画面（`/risk`）

- [x] ロット上限・日次損失上限・最大ポジション数の編集フォームを実装
- [x] 設定変更時の確認ダイアログを実装

### 約定履歴画面（`/history`）

- [x] 日付・銘柄・戦略でフィルタリングできる履歴テーブルを実装
- [x] 日次 P&L の折れ線グラフを実装
- [x] 戦略別 P&L の棒グラフを実装

### テスト

- [x] `useStream` フックのユニットテスト
- [x] 緊急停止ボタンのクリック → API 呼び出しのテスト

## 確認

- [x] trading-engine を Windows 側で起動し MT5 デモ口座に接続できることを確認
- [x] mt5-service が WebSocket でイベントを受信し DB に保存されることを確認
- [x] ダッシュボードでリアルタイム P&L が更新されることを確認
- [x] UI から戦略を有効化 → Engine で戦略が起動することを確認
- [x] 緊急停止ボタンで全ポジションが決済されることを確認
