# Text Reader

txt / md ファイルをブラウザの読み上げ機能に最適化された記事ページとして表示する PWA。

## 主な機能

- `.txt` / `.md` ファイルのアップロード（ファイル選択・ドラッグ&ドロップ・テキスト貼り付け）
- セマンティックな `<article>` 構造で表示し、Chromeの「このページを読み上げる」を引き出しやすくする
- 自前 `SpeechSynthesis` プレイヤー（速度・音声選択・チャンク分割）
- IndexedDB によるドキュメント保存 + ストレージ永続化要求
- PWA としてインストール可能（`display: minimal-ui`）
- **Web Share Target**: Android のホーム画面に追加後、他アプリの共有メニューに本アプリが現れ、txt / md を直接取り込める
- **File Handling**: インストール後、OS のファイルマネージャから `.txt` / `.md` を「このアプリで開く」で起動して取り込める（Chromium 系のみ）
- ライト / ダーク テーマ、フォントサイズ・行間・最大幅の調整

## できないこと（仕様上）

- Chrome 純正の読み上げ機能を JavaScript から起動・制御することはできない（ユーザーがメニューから手動で起動）
- iOS Safari は Web Share Target API 非対応（手動アップロードのみ）
- IndexedDB は端末ストレージ逼迫時に消える可能性あり（永続化要求済）

## 開発

```bash
pnpm install
pnpm dev      # 開発サーバー
pnpm build    # 本番ビルド (dist/)
pnpm preview  # 本番ビルドのプレビュー
```

## デプロイ

GitHub Pages を想定。`base` は `/text-reader/` に固定。

1. リポジトリ名を `text-reader` で作成して push
2. GitHub の Settings → Pages → Source を **GitHub Actions** に設定
3. `main` ブランチへの push で `.github/workflows/deploy.yml` が走り、`dist/` を Pages に配信

URL: `https://<user>.github.io/text-reader/`

### 別名で公開したい場合

`vite.config.ts` の `BASE` と manifest の `start_url` / `scope` / `share_target.action` を変更してください。

## Android で共有受信を使う手順

1. Android Chrome で公開URLを開く
2. メニュー (⋮) → 「ホーム画面に追加」
3. ファイルマネージャ等で `.txt` / `.md` を共有 → 共有先一覧に **TextReader** が表示される
4. 選択するとアプリが起動し、ファイルが取り込まれて自動表示

## 読み上げ手段

- **推奨**: Android Chrome の `⋮ → このページを読み上げる`（端末搭載の高品質ニューラル音声）
- **代替**: アプリ下部の自前プレイヤー（`SpeechSynthesis` API、OS音声に依存）

## 技術スタック

- Vite + TypeScript（Vanilla DOM）
- `vite-plugin-pwa`（injectManifest 戦略）
- `idb` — IndexedDB wrapper
- `markdown-it` — Markdown レンダリング
