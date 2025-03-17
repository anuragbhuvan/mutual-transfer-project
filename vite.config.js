import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindCSS from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {  const env = loadEnv(mode, process.cwd(), '')
  const isDevelopment = mode === 'development'
  
  const corsHeaders = {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Request-Method, Access-Control-Request-Headers',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'Content-Length, X-Content-Type-Options'
  };

  return {
    plugins: [react(), tailwindCSS()],
    server: {
      port: 3001,
      host: true,
      strictPort: true,
      open: true,
      headers: corsHeaders,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              const origin = req.headers.origin;
              if (origin) {
                proxyReq.setHeader('Origin', origin);
              }
              proxyReq.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
              if (req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
              }
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              if (req.method === 'OPTIONS') {
                proxyRes.statusCode = 204;
              }
            });
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
          }
        }
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
      hmr: {
        overlay: true,
        port: 3000,
        host: 'localhost',
      }
    },
    preview: {
      port: 3000,
      headers: corsHeaders
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
          }
        }
      },
      minify: 'esbuild'
    }
  }
}) 