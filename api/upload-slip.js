// In-memory store for Vercel Serverless (scoped to function instance)
const slipsStore = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
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

      slipsStore.set(slipId, { buffer, mimeType, createdAt: Date.now() });

      const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const proto = forwardedHost.includes('localhost') ? 'http' : 'https';
      const publicUrl = `${proto}://${forwardedHost}/api/slips/${slipId}.jpg`;

      return res.status(200).json({
        success: true,
        url: publicUrl,
        slipId,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Error processing slip' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
