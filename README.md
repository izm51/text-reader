# Text Reader

https://izm51.github.io/text-reader/

txt / md ファイルをブラウザの読み上げ機能に最適化された記事ページとして表示する PWA。

## 機能

- `.txt` / `.md` のアップロード（ファイル選択 / ドラッグ&ドロップ / 貼り付け）
- セマンティックな `<article>` 構造で表示
- `SpeechSynthesis` による読み上げプレイヤー
- IndexedDB によるドキュメント保存
- PWA インストール、Web Share Target、File Handling 対応
- テーマ・フォントサイズ・行間・最大幅の調整

## Android で共有受信を使う手順

1. Android Chrome で公開URLを開く
2. メニュー (⋮) → 「ホーム画面に追加」
3. ファイルマネージャ等で `.txt` / `.md` を共有 → 共有先一覧に **TextReader** が表示される
4. 選択するとアプリが起動し、ファイルが取り込まれて自動表示

## 読み上げ手段

- **推奨**: Android Chrome の `⋮ → このページを読み上げる`（端末搭載の高品質ニューラル音声）
- **代替**: アプリ下部の自前プレイヤー（`SpeechSynthesis` API、OS音声に依存）

## 開発

```bash
pnpm install
pnpm dev
pnpm build
```
