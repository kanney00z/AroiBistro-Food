import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function lineNotifyProxyPlugin(): Plugin {
  return {
    name: 'line-notify-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url === '/api/line/notify' || req.url === '/api/line-notify') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const token =
                parsed.token ||
                process.env.LINE_CHANNEL_ACCESS_TOKEN ||
                'XSOp1dJdNKEw9HGD7fRlN4VJX5fWYmS/EYXqWMMq5pHMtWXOizNLp5FEaNyDbmoalfFkqPBxbn/y9cEWse3hl5OEyUUkKZf9Ej/y2DO5+WLhuLDuIvlkx4LT+imCU+Ptl9kklN7nG1FRzPDemE73tgdB04t89/1O/w1cDnyilFU=';

              const isPush = Boolean(
                parsed.targetId && typeof parsed.targetId === 'string' && parsed.targetId.trim().length > 0
              );
              const lineEndpoint = isPush
                ? 'https://api.line.me/v2/bot/message/push'
                : 'https://api.line.me/v2/bot/message/broadcast';

              const payload = isPush
                ? { to: parsed.targetId.trim(), messages: parsed.messages }
                : { messages: parsed.messages };

              const lineRes = await fetch(lineEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token.trim()}`,
                },
                body: JSON.stringify(payload),
              });

              const text = await lineRes.text();
              res.writeHead(lineRes.status, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(text || JSON.stringify({ success: lineRes.ok }));
            } catch (err: any) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), lineNotifyProxyPlugin()],
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
