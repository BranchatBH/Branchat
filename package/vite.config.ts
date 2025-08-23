import path from 'node:path'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './manifest.config.js'
import { name, version } from './package.json'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
    zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
    tailwindcss(),
  ],
  // 👇 여기가 핵심 수정 부분입니다.
  build: {
    rollupOptions: {
      // 익스텐션이 사용하는 모든 HTML 페이지를 진입점으로 등록합니다.
      // 이렇게 해야 React 같은 공통 라이브러리를 공유할 수 있습니다.
      input: {
        sidepanel: path.resolve(__dirname, 'src/sidepanel/main.html'),
        // 팝업 페이지가 있다면 아래 줄의 주석을 해제하고 경로를 맞추세요.
        // popup: path.resolve(__dirname, 'src/popup/main.html'),
      },
      output: {
        // 공통 코드를 분리하여 중복 로딩을 방지합니다.
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: '[name]/index.js',
      },
    },
    outDir: 'dist',
  },
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
})
