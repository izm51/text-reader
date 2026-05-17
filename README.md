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

## 開発

```bash
pnpm install
pnpm dev
pnpm build
```
