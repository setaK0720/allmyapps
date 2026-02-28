# Spec: App Portal

## 概要

自作アプリへのアクセスを一元化するポータルサイト。アプリ一覧のブラウジング、検索・フィルタリング、各アプリの詳細確認ができる。初期段階ではDBを使わず、静的な TypeScript 定数でデータを管理する。

---

## データモデル

### `AppEntry`

```ts
type AppStatus = 'active' | 'beta' | 'archived' | 'planned';

interface AppEntry {
  id: string;               // kebab-case の一意識別子（例: "task-mgmt"）
  name: string;             // 表示名（例: "タスク管理"）
  description: string;      // 短い説明（1〜2文）
  url: string;              // アクセスURL
  category: string;         // カテゴリ（例: "productivity", "tools"）
  tags: string[];           // 任意のタグ
  status: AppStatus;        // ステータス
  iconUrl?: string;         // アイコン画像URL（省略可）
  screenshotUrls?: string[]; // スクリーンショットURL（省略可）
  addedAt: string;          // ISO 8601 日付（例: "2026-02-28"）
}
```

### データファイル

```
apps/portal/src/data/apps.ts
```

TypeScript 定数として `AppEntry[]` を export する。

---

## ルーティング

| パス | コンポーネント | 説明 |
|------|--------------|------|
| `/` | `CatalogPage` | アプリ一覧（グリッド/リスト） |
| `/apps/:id` | `AppDetailPage` | アプリ詳細 |

React Router v7 を使用する。

---

## コンポーネント構成

```
apps/portal/src/
├── data/
│   └── apps.ts              # AppEntry[] の静的データ
├── features/
│   ├── catalog/
│   │   ├── CatalogPage.tsx  # 一覧ページ（検索・フィルター・ビュー切替）
│   │   ├── AppGrid.tsx      # グリッド表示
│   │   ├── AppList.tsx      # リスト表示
│   │   ├── AppCard.tsx      # グリッド用カード
│   │   ├── AppRow.tsx       # リスト用行
│   │   ├── SearchBar.tsx    # 検索入力
│   │   └── CategoryFilter.tsx # カテゴリ・タグフィルター
│   └── detail/
│       └── AppDetailPage.tsx # 詳細ページ
├── App.tsx
└── main.tsx
```

---

## 機能仕様

### app-catalog（一覧）

- デフォルトはグリッド表示。グリッド/リスト切替ボタンを右上に配置
- `active` ステータスのアプリを優先表示し、その後 `beta` → `planned` → `archived` の順
- アイコン未設定時はアプリ名の頭文字をプレースホルダーとして表示

### app-registry（データ管理）

- `apps.ts` に静的データを定義
- カテゴリは `apps.ts` から動的に収集（ハードコードしない）
- 将来のDB化を想定し、データアクセスを直接参照ではなくヘルパー関数経由にする

```ts
// apps/portal/src/data/apps.ts に追加
export function getAllApps(): AppEntry[] { ... }
export function getAppById(id: string): AppEntry | undefined { ... }
export function getCategories(): string[] { ... }
```

### app-detail（詳細）

- 存在しない `id` の場合は一覧ページにリダイレクト
- スクリーンショットがある場合は画像ギャラリーを表示
- 「アプリを開く」ボタンで `url` に遷移（`target="_blank"`, `rel="noopener noreferrer"`）

### category-filter（フィルター）

- カテゴリボタン（全て / 各カテゴリ）をタブ形式で表示
- タグはチェックボックスまたはバッジで複数選択可能
- 検索テキスト × カテゴリ × タグのAND条件で絞り込む
- フィルター条件は URL クエリパラメータ（`?category=&tags=&q=`）で管理

---

## UIライブラリ・スタイリング

- `@allmyapps/ui` パッケージの共通コンポーネントを使用（Button, Badge, Card, Input）
- Tailwind CSS v4 でスタイリング
- レスポンシブ対応必須（モバイル〜デスクトップ）

---

## 技術スタック

| 項目 | 採用技術 |
|------|---------|
| フレームワーク | Vite + React 19 + TypeScript strict |
| ルーティング | React Router v7 |
| UI | `@allmyapps/ui` + Tailwind CSS v4 |
| データ | 静的 TypeScript 定数（DBなし） |
| テスト | Vitest |

---

## 非機能要件

- TypeScript strict モード。`any` 型禁止（`unknown` を使用）
- データアクセスはヘルパー関数経由（将来のDB化への備え）
- `target="_blank"` には必ず `rel="noopener noreferrer"` を付与
- アクセシビリティ：フィルターUIにはキーボード操作対応

---

## スコープ外（将来対応）

- 認証・アクセス制御
- DB によるデータ管理
- アプリの追加・編集フォーム（管理UI）
- サーバーサイドレンダリング
