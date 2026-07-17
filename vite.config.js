import { defineConfig } from 'vite';
import { resolve } from 'path';
import injectHTML from 'vite-plugin-html-inject';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: resolve(__dirname, 'src'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2020',

    // ──────────────────────────────────────────────────────
    // GUARDRAIL: Forzar inlining de CUALQUIER asset local
    // sin importar el tamaño. Por defecto Vite solo incrusta
    // archivos < 4 KB; los más grandes los extrae a
    // dist/assets/, rompiendo el concepto de "archivo único".
    // Con 100 MB de límite, cualquier .woff2, SVG, imagen
    // o fuente local se convierte a Base64 dentro del HTML.
    // ──────────────────────────────────────────────────────
    assetsInlineLimit: 100000000,

    cssCodeSplit: false,

    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      output: {
        inlineDynamicImports: true,
      },
    },
  },

  plugins: [
    injectHTML({ root: resolve(__dirname, 'src') }),
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true,
    }),
  ],

  css: {
    postcss: './postcss.config.js',
  },
});
