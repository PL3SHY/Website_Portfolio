import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Demo build for the portfolio:
//  - relative asset paths, so it can be served from any folder (/demos/commerciales-flores/)
//  - `import.meta.env.DEV` forced on, so the app skips the Cloudflare Turnstile bot check
//  - a fake backend address, only used by the demo's fetch interceptor (src/demo/install.ts)
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.DEV': 'true',
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://demo.invalid'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('demo'),
  },
  optimizeDeps: { include: ['react', 'react-dom'] },
  resolve: { dedupe: ['react', 'react-dom'] },
});
