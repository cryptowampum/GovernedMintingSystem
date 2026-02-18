import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Write version.json to public so it's served as a static file
mkdirSync('./public', { recursive: true })
writeFileSync('./public/version.json', JSON.stringify({ service: 'admin', version: pkg.version }))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress' }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
            if (id.includes('thirdweb')) return 'thirdweb';
            if (id.includes('ethers')) return 'ethers';
            if (id.includes('viem')) return 'viem';
            if (id.includes('wagmi')) return 'wagmi';
            if (id.includes('rainbowkit')) return 'rainbowkit';
            if (id.includes('tanstack')) return 'tanstack';
            if (id.includes('autoconnect') || id.includes('unicorn')) return 'web3-connect';
            if (id.includes('metamask-sdk')) return 'metamask-sdk';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3002,
    strictPort: true,
  },
})
