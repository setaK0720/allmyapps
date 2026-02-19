# allmyapps — Claude 向け開発ガイドライン

## プロジェクト概要

タスク管理アプリを皮切りに、複数アプリを束ねるセルフホスト型プラットフォームのモノレポ。

## リポジトリ構成

```
allmyapps/
├── apps/            # フロントエンドアプリ (Vite + React + TypeScript)
│   └── task-mgmt/
├── services/        # バックエンドサービス (Hono + Bun)
│   └── task-service/
├── packages/        # 共有パッケージ
│   ├── ui/          # 共通UIコンポーネント (shadcn/ui ベース)
│   └── api-client/  # API型定義・クライアント
└── specs/           # 仕様ファイル
    ├── openapi/     # OpenAPI スキーマ
    └── features/    # 機能仕様
```

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| モノレポ管理 | Turborepo + pnpm workspaces |
| フロントエンド | Vite + React + TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS v4 |
| バックエンド | Hono (Bun runtime) |
| DB | PostgreSQL + Drizzle ORM |
| テスト | Vitest |
| API型生成 | openapi-typescript |

## 開発ルール

### 仕様の確認（必須）

- **実装前に必ず `specs/` ディレクトリの関連仕様を読むこと**
- `specs/openapi/` に OpenAPI スキーマがある場合はそちらを参照する
- `specs/features/` に機能仕様がある場合はそちらを参照する
- **仕様に記載のない機能・フィールド・エンドポイントを勝手に追加しない**

### TypeScript

- `any` 型の使用は禁止（`unknown` を使い適切に型ガードする）
- TypeScript strict モードを維持する
- API の型は `openapi-typescript` で生成した型を使用する
  - 生成コマンド: `pnpm --filter api-client generate`

### テスト

- **テストは実装と同時に作成する**（後回し禁止）
- テストフレームワーク: Vitest
- ユニットテストはロジックの隣に `*.test.ts` / `*.test.tsx` として配置
- APIの結合テストは `services/*/src/__tests__/` に配置

### コミット

- コミットメッセージは日本語または英語で明確に記述する
- 1コミット1機能・1修正を原則とする

### コード品質

- ESLint のエラーを残さない
- 未使用のインポート・変数を残さない
- コメントは「なぜ」を書く（「何を」はコードで表現する）
