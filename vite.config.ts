import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Ensure React is available globally for JSX
      jsxImportSource: 'react',
      babel: {
        plugins: []
      }
    })
  ],
  define: {
    // Ensure React is available globally in production builds
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wagmi: ['wagmi', 'viem', '@tanstack/react-query'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime']
  }
})
