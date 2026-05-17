import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const BASE = '/text-reader/';

export default defineConfig({
  base: BASE,
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
      manifest: {
        name: 'Text Reader',
        short_name: 'TextReader',
        description: 'txt / md をブラウザ読み上げ対応の記事として表示するリーダー',
        lang: 'ja',
        dir: 'ltr',
        theme_color: '#1f1f1f',
        background_color: '#ffffff',
        display: 'minimal-ui',
        display_override: ['minimal-ui', 'standalone'],
        start_url: `${BASE}`,
        scope: `${BASE}`,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
        share_target: {
          action: `${BASE}share`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'file',
                accept: [
                  'text/plain',
                  'text/markdown',
                  'text/x-markdown',
                  'application/octet-stream',
                  '.txt',
                  '.md',
                  '.markdown',
                ],
              },
            ],
          },
        },
        file_handlers: [
          {
            action: `${BASE}`,
            accept: {
              'text/plain': ['.txt'],
              'text/markdown': ['.md', '.markdown'],
            },
          },
        ],
        shortcuts: [
          {
            name: 'ライブラリを開く',
            short_name: 'ライブラリ',
            url: `${BASE}`,
          },
        ],
      },
    }),
  ],
});
