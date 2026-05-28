import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // SINAN PROTOCOL: PROXY TUNNEL
      // This tunnels API requests to the live WordPress backend during local development
      proxy: {
        '/wp-json': {
          target: 'https://hava-durumlari.tr', // LIVE Domain
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[Proxy] ${req.method} ${req.url} → ${options.target}${req.url}`);
            });
            proxy.on('error', (err, req) => {
              console.error('[Proxy Error]', err.message);
            });
          }
        }
      }
    },
    plugins: [
      react(),
      // analyze({ summaryOnly: true }) // Optional: Uncomment to see bundle size in terminal
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable source maps for production to save space
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      manifest: true, // Enable manifest for PHP integration
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React Vendor
            'vendor-react': ['react', 'react-dom', 'react-router-dom'], // react-router is likely used if LocationSearchPage is a route, or just for future proofs

            // Visualization Heavyweights (Lazy Loaded)
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet', 'react-leaflet'],

            // UI Utilities
            'vendor-ui': ['lucide-react', 'framer-motion'],

            // Core Utilities (Moment, etc if used, otherwise grouping helpers)
            // 'vendor-utils': ['axios', 'date-fns'] // Example
          }
        }
      }
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
