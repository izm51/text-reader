# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
pnpm dev      # 開発サーバー
pnpm build    # tsc -b && vite build
```

## 注意点

- IndexedDB スキーマは `src/lib/db.ts` と `src/sw.ts` で二重定義。SW から `db.ts` を import できないため。変更時は両方を同期し `DB_VERSION` を上げる。
- `vite.config.ts` の `BASE = '/text-reader/'` が manifest の `start_url` / `scope` / `share_target.action` の元になっており、配信パスを変えるならここを変える。
- CSS の `:hover` は必ず `@media (hover: hover) { ... }` で囲む。タッチ端末で次のタップまでホバー状態が貼り付くのを防ぐため。押下中のフィードバックは `:active`、永続的な状態は修飾子クラス（`--starred` 等）や `:focus-visible` を使う。

## PR

タイトル・本文は日本語。
