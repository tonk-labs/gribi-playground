import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import copy from 'rollup-plugin-copy';
import fs from 'fs';
import path from 'path';


const wasmContentTypePlugin = {
  name: 'wasm-content-type-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
        const newPath = req.url.replace('deps', 'dist');
        const targetPath = path.join(__dirname, newPath);
        const wasmContent = fs.readFileSync(targetPath);
        return res.end(wasmContent);
      }
      next();
    });
  },
};

export default defineConfig(({ command }) => {
  return {
    plugins: [react({
      babel: {
        plugins: ["@babel/plugin-syntax-top-level-await"]
      },
    }),
    copy({
      targets: [{ src: 'node_modules/**/*.wasm', dest: 'node_modules/.vite/dist' }],
      copySync: true,
      hook: 'buildStart',
    }),
    command === 'serve' ? wasmContentTypePlugin : [],
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: i => `__tla_${i}`
    })
  ],
    server: {
      port: 3000,
      fs: {
        strict: false,
      },
    },
    build: {
      target: "es2022",
      minify: true,
      sourcemap: true,
    }
  };
});