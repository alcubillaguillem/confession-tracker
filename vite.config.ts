import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// CSP estricta solo en build (el servidor de desarrollo inyecta estilos inline).
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    {
      name: 'csp',
      apply: 'build',
      transformIndexHtml: (html) =>
        html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`),
    },
  ],
  build: { sourcemap: false, assetsInlineLimit: 0, modulePreload: { polyfill: false } },
  test: { environment: 'node' },
});
