# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
pnpm install
pnpm dev      # 開発サーバー
pnpm build    # 型チェック (tsc -b) + 本番ビルド (dist/)
pnpm preview  # 本番ビルドのプレビュー
```

テスト・Lint スクリプトは未定義。

## アーキテクチャ

Vite + TypeScript (Vanilla DOM) の PWA。フレームワーク非依存で、`src/main.ts` → `src/app.ts` がエントリ。

- **ルーティング**: `src/router.ts` がクエリパラメータ (`?view=settings`, `?doc=<id>`) ベースの簡易ルーター。`popstate` で `renderApp` を再実行することでビューを切り替える。
- **ビュー**: `src/views/{library,reader,settings}.ts`。`renderApp` が `view` / `doc` パラメータを見て該当ビューを `#app` 配下に描画する。
- **ドキュメント永続化**: IndexedDB (`idb` ラッパー)。`src/lib/db.ts` が唯一のストア `documents` を管理。スキーマ変更時は `DB_VERSION` を上げ、`src/sw.ts` 側の同名 DB 定義も合わせて更新する必要がある。
- **取り込み経路**: ① UI からのアップロード/貼り付け (`src/lib/import.ts`)、② Web Share Target (`POST /share`) — `src/sw.ts` の `fetch` ハンドラが multipart を受けて IndexedDB に直接書き込み、`?doc=<id>` にリダイレクト、③ File Handling API (`src/lib/launch.ts`) が `window.launchQueue` を購読。
- **Service Worker**: `vite-plugin-pwa` の `injectManifest` 戦略で `src/sw.ts` をそのままビルド。manifest (`share_target`, `file_handlers`, `start_url`, `scope`) は `vite.config.ts` 内に定義。
- **読み上げ**: `src/lib/tts.ts` の `SpeechSynthesis` 自前プレイヤー。Chrome 純正の「このページを読み上げる」はセマンティック `<article>` 構造によって誘発される（JS から制御不可）。

## 重要な制約

- `vite.config.ts` の `BASE = '/text-reader/'` が GitHub Pages 配信パスにハードコードされており、manifest の `start_url` / `scope` / `share_target.action` も同じ定数から組み立てている。別名で公開する場合は `BASE` を変更する。
- `src/sw.ts` と `src/lib/db.ts` で IndexedDB スキーマ (`text-reader` / `documents`) を二重定義している（SW は `idb` のみで `db.ts` をインポートできないため）。両者を必ず同期させること。
- `main` への push で `.github/workflows/deploy.yml` が走り Pages に自動デプロイされる。

## PR ルール

- **Pull Request のタイトル・本文は日本語で記述する。**
