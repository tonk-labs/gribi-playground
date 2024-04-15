import { defineConfig } from 'vite'
import path from 'path';
import fs from 'fs';
import dts from 'vite-plugin-dts'
import copy from 'rollup-plugin-copy';

// const wasmContentTypePlugin = {
//   name: 'wasm-content-type-plugin',
//   configureServer(server) {
//     server.middlewares.use(async (req, res, next) => {
//       if (req.url.endsWith('.wasm')) {
//         res.setHeader('Content-Type', 'application/wasm');
//         const newPath = req.url.replace('deps', 'dist');
//         const targetPath = path.join(__dirname, newPath);
//         const wasmContent = fs.readFileSync(targetPath);
//         return res.end(wasmContent);
//       }
//       next();
//     });
//   },
// };


// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
    return {
      base: './',
      test: {
        globals: true,
        environment: 'jsdom',
      },
      optimizeDeps: {
        esbuildOptions: {
          target: 'esnext'
        }
      },
      plugins: [
        dts({ rollupTypes: true }),
        // copy({
        //   targets: [{ src: 'node_modules/**/*.wasm', dest: 'node_modules/.vite/dist' }],
        //   copySync: true,
        //   hook: 'buildStart',
        // }),
        // command === 'serve' ? wasmContentTypePlugin : [],
      ],
      build: {
        rollupOptions: {
          external: ['@noir-lang/noir_js', '@noir-lang/backend_barretenberg', '@noir-lang/types']
        },
        sourcemap: true,
        target: 'esnext',
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'commit-update-reveal',
          fileName: (format) => `commit-update-reveal.${format}.js`
        }
      }
    }
});

