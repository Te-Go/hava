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
    // THIS IS THE FIX: Tell Vite exactly where its assets live on the production server
    base: '/wp-content/themes/generatepress_child/dist/',
    plugins: [
      react(),
      // analyze({ summaryOnly: true }) // Optional: Uncomment to see bundle size in terminal
    ],
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      outDir: 'generatepress_child/dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable source maps for production to save space
      minify: 'esbuild', // Use native, high-performance esbuild minification
      manifest: true, // Enable manifest for PHP integration
      rollupOptions: {
        output: {
          entryFileNames: 'bundle.js',
          inlineDynamicImports: true,
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          manualChunks: undefined
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
