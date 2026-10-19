import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import type {IncomingMessage, ServerResponse} from 'http';
import {defineConfig, type Plugin} from 'vite';

function glossaryDevSave(): Plugin {
  return {
    name: 'glossary-dev-save',
    configureServer(server) {
      server.middlewares.use('/__glossary/terms', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'PUT') {
          next();
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => {
          try {
            const terms = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!Array.isArray(terms)) {
              throw new Error('Expected an array of terms');
            }
            const filePath = path.resolve(__dirname, 'public/terms.json');
            fs.writeFileSync(filePath, `${JSON.stringify(terms, null, 2)}\n`);
            res.statusCode = 204;
            res.end();
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'Invalid glossary payload'}));
          }
        });
      });
    },
  };
}

export default defineConfig(({command}) => {
  return {
    // GitHub Pages serves this repo at /Glossario-CD/, not at the domain root.
    base: command === 'build' ? '/Glossario-CD/' : '/',
    plugins: [react(), tailwindcss(), glossaryDevSave()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
