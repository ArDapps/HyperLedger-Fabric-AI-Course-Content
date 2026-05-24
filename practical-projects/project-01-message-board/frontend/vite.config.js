import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// هذا ملف إعداد Vite.
// نستخدم plugin-react حتى تعمل JSX و React Fast Refresh أثناء التطوير.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
