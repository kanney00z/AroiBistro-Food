import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser for JSON
  app.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // LINE Notification Proxy Endpoint
  app.post('/api/line/notify', async (req, res) => {
    try {
      const { token, targetId, messages } = req.body;
      const channelAccessToken =
        token ||
        process.env.LINE_CHANNEL_ACCESS_TOKEN ||
        'XSOp1dJdNKEw9HGD7fRlN4VJX5fWYmS/EYXqWMMq5pHMtWXOizNLp5FEaNyDbmoalfFkqPBxbn/y9cEWse3hl5OEyUUkKZf9Ej/y2DO5+WLhuLDuIvlkx4LT+imCU+Ptl9kklN7nG1FRzPDemE73tgdB04t89/1O/w1cDnyilFU=';

      if (!channelAccessToken) {
        return res.status(400).json({
          success: false,
          message: 'Missing LINE Channel Access Token',
        });
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing messages array in payload',
        });
      }

      const isPush = Boolean(targetId && typeof targetId === 'string' && targetId.trim().length > 0);
      const lineEndpoint = isPush
        ? 'https://api.line.me/v2/bot/message/push'
        : 'https://api.line.me/v2/bot/message/broadcast';

      const lineBody = isPush
        ? { to: targetId.trim(), messages }
        : { messages };

      const response = await fetch(lineEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken.trim()}`,
        },
        body: JSON.stringify(lineBody),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return res.json({
          success: true,
          message: isPush
            ? `ส่งข้อความ Push Notification ไปยัง (${targetId}) สำเร็จ!`
            : 'ส่งข้อความ Broadcast แจ้งเตือนเข้า LINE สำเร็จ!',
          data,
        });
      } else {
        const errText = await response.text();
        console.error('LINE Messaging API Error:', response.status, errText);
        return res.status(response.status).json({
          success: false,
          message: `LINE API responded with status ${response.status}: ${errText}`,
          statusCode: response.status,
          error: errText,
        });
      }
    } catch (err: any) {
      console.error('Internal Server Error while sending LINE notification:', err);
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${err.message || err}`,
      });
    }
  });

  // Vite development middleware or Static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AroiBistro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
