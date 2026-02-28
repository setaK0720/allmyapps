# Tasks: App Portal

## セットアップ

- [x] `apps/portal/` を Vite + React 19 + TypeScript strict で初期化（pnpm workspace に追加）
- [x] `@allmyapps/ui` と `react-router` v7 を依存に追加
- [x] Tailwind CSS v4 を設定
- [x] Turborepo の `turbo.json` に portal を追加

## データ層（app-registry）

- [x] `AppEntry` 型と `AppStatus` 型を定義（`src/data/apps.ts`）
- [x] サンプルアプリデータを `apps.ts` に記述（task-mgmt を含む最低2件）
- [x] ヘルパー関数を実装：`getAllApps()`, `getAppById()`, `getCategories()`

## ルーティング

- [x] `App.tsx` に React Router v7 でルート定義（`/` と `/apps/:id`）

## 一覧ページ（app-catalog）

- [x] `CatalogPage.tsx` を実装（URL クエリパラメータでフィルター状態を管理）
- [x] `SearchBar.tsx` を実装（テキスト検索）
- [x] `CategoryFilter.tsx` を実装（カテゴリタブ + タグ複数選択）
- [x] `AppCard.tsx` を実装（グリッド用カード、アイコン未設定時は頭文字表示）
- [x] `AppRow.tsx` を実装（リスト用行）
- [x] `AppGrid.tsx` を実装（グリッドレイアウト）
- [x] `AppList.tsx` を実装（リストレイアウト）
- [x] グリッド/リスト切替ボタンを実装
- [x] フィルタリングロジックを実装（テキスト × カテゴリ × タグの AND 条件）

## 詳細ページ（app-detail）

- [x] `AppDetailPage.tsx` を実装
- [x] 存在しない ID の場合は `/` にリダイレクト
- [x] 「アプリを開く」ボタンを実装（`target="_blank"` + `rel="noopener noreferrer"`）
- [x] スクリーンショットギャラリーを実装（`screenshotUrls` がある場合のみ表示）

## テスト

- [x] `getAppById` のユニットテスト（存在するID・存在しないID）
- [x] `getCategories` のユニットテスト（重複なし・ソート済み）
- [x] フィルタリングロジックのユニットテスト（テキスト・カテゴリ・タグ・AND 条件）

## 確認

- [x] `bun run --filter portal dev` で起動確認
- [ ] レスポンシブ表示確認（モバイル・タブレット・デスクトップ）
- [x] TypeScript strict モードでエラーなし確認（`bunx tsc --noEmit`）
