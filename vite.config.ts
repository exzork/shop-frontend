import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 10001,
    proxy: {
      '/api/image/cache': {
        target: 'https://shop.exzork.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/image\/cache/, '/api/image/cache'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Get the URL from the query parameter
            const url = new URL(req.url!, 'http://localhost');
            const targetUrl = url.searchParams.get('url');
            if (targetUrl) {
              // Set the target URL as a header
              proxyReq.setHeader('X-Target-URL', targetUrl);
            }
          });
        }
      }
    }
  },
})
