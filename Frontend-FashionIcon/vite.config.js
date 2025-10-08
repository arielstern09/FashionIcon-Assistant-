import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path'; // Retained for Chrome extension build setup
import tailwindcss from '@tailwindcss/vite'; // New import from your input

export default defineConfig({
  plugins: [
    // 1. New: Use the official Tailwind CSS Vite plugin
    tailwindcss(),
    
    // 2. Updated: React plugin with experimental React Compiler babel plugin
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],

  build: {
    outDir: 'dist', 
    rollupOptions: {
      input: {
        // Essential: Entry point for the Chrome Extension UI
        popup: resolve(__dirname, 'popup.html'), 
        
        // Essential: Separate entry point for the Service Worker
        'service-worker': resolve(__dirname, 'service-worker.js'), 
      },
      output: {
        // Ensures the Service Worker is placed at the root of the dist folder
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') {
            return 'service-worker.js';
          }
          return 'assets/[name]-[hash].js'; 
        },
      },
    },
  },
});
