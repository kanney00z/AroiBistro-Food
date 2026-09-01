import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser for JSON with large limit for image slips
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // In-memory store for slip images (with LRU eviction to prevent memory leaks)
  const slipsStore = new Map<string, { buffer: Buffer; mimeType: string; createdAt: number }>();

  // Helper to determine base public URL from request
  const getPublicBaseUrl = (req: express.Request): string => {
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
    // If running in development cloud container or custom domain, ensure https if not localhost
    const proto = forwardedHost.includes('localhost') ? forwardedProto : 'https';
    return `${proto}://${forwardedHost}`;
  };

  // Upload Slip Endpoint: receives base64 slip and returns public HTTPS URL
  app.post('/api/upload-slip', (req, res) => {
    try {
      const { image } = req.body || {};
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ success: false, message: 'Missing image data' });
      }

      const rawBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
      const mimeType = image.includes('image/png')
        ? 'image/png'
        : image.includes('image/webp')
        ? 'image/webp'
        : 'image/jpeg';
      const buffer = Buffer.from(rawBase64, 'base64');
      const slipId = `slip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Evict oldest entries if store exceeds 300 items
      if (slipsStore.size > 300) {
        const oldestKey = slipsStore.keys().next().value;
        if (oldestKey) slipsStore.delete(oldestKey);
      }

      slipsStore.set(slipId, { buffer, mimeType, createdAt: Date.now() });

      const baseUrl = getPublicBaseUrl(req);
      const publicUrl = `${baseUrl}/api/slips/${slipId}.jpg`;

      return res.json({
        success: true,
        url: publicUrl,
        slipId,
      });
    } catch (err: any) {
      console.error('Error handling /api/upload-slip:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to process slip image' });
    }
  });

  // Serve Public Slip Images for LINE Messaging API
  app.get('/api/slips/:slipId', (req, res) => {
    const { slipId } = req.params;
    const cleanId = slipId.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const slip = slipsStore.get(cleanId);

    if (!slip) {
      return res.status(404).send('Slip image not found or expired');
    }

    res.setHeader('Content-Type', slip.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(slip.buffer);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), slipsCached: slipsStore.size });
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
