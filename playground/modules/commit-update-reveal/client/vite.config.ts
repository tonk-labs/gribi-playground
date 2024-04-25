import { defineConfig } from 'vite'
import path from 'path';
import dts from 'vite-plugin-dts'


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
      ],
      build: {
        sourcemap: true,
        target: 'esnext',
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'commit-update-reveal',
          fileName: (format) => `commit-update-reveal.${format}.js`,
          formats: ['es']
        }
      }
    }
});

