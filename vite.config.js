import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5011,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5011',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Abaikan notifikasi peringatan dynamic vs static import chunk
        if (
          warning.message?.includes('dynamic import will not move module into another chunk') ||
          warning.code === 'DYNAMIC_IMPORT_WILL_NOT_MOVE_MODULE_INTO_ANOTHER_CHUNK'
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
