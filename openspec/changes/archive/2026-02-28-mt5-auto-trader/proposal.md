## Why

スキャルピング戦略による自動売買を実現したい。MT5 口座に接続し、複数の通貨ペアで戦略を並列実行しながら、ポジション・約定履歴・損益をリアルタイムで把握・制御できる環境が必要。

手動トレードでは反応速度に限界があり、複数シンボルの同時管理も困難。戦略をコードで定義し、リスク管理も自動化することで再現性のある取引を実現する。

## What Changes

- MT5 に接続してスキャルピング戦略を自動実行する **Python Trading Engine** を新規作成
- 約定履歴・戦略設定・リスク設定を管理する **バックエンドサービス** を新規作成
- 戦略の監視・制御・履歴閲覧ができる **トレーディングダッシュボード** を新規作成

## Capabilities

### New Capabilities

- `strategy-engine`: MT5 に接続し、複数の戦略を通貨ペアごとに並列実行する Python エンジン
- `strategy-registry`: 戦略の設定（シンボル・タイムフレーム・パラメータ・有効/無効）を DB で管理し、UI から変更できる仕組み
- `risk-manager`: Python 側のハードリミット（ロット・ドローダウン）と TypeScript 側のソフト制御（日次損失上限・緊急停止）による二層リスク管理
- `position-tracker`: オープンポジションをリアルタイムで把握し、WebSocket 経由でダッシュボードに配信
- `trade-history`: 約定履歴・P&L・統計を PostgreSQL に永続化し、分析できるようにする
- `trading-dashboard`: 戦略の ON/OFF・パラメータ変更・緊急停止・履歴閲覧ができる React UI

### Modified Capabilities

- `app-registry`（portal）: 新しいトレーディングアプリをポータルのアプリ一覧に追加

## Impact

- `trading-engine/` を新規 Python プロジェクトとして追加（Windows 側で実行）
- `services/mt5-service/` を新規バックエンドとして追加（Hono + Drizzle + PostgreSQL）
- `apps/trading/` を新規フロントエンドとして追加（Vite + React）
- Python Engine と mt5-service は WebSocket + REST で双方向通信
- 戦略実行の **クリティカルパスは Python Engine 内で完結**（TypeScript は経由しない）

## 運用前提

- Windows ホスト上で MT5 Terminal と trading-engine.py を常時起動
- WSL2 側で mt5-service と PostgreSQL を常時起動
- Windows 11 の WSL2 ミラーリングネットワークで localhost 通信
