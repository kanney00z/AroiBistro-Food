export default async function handler(req, res) {
  // Set CORS headers
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { token, targetId, messages } = req.body || {};
    const channelAccessToken =
      token ||
      process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      'XSOp1dJdNKEw9HGD7fRlN4VJX5fWYmS/EYXqWMMq5pHMtWXOizNLp5FEaNyDbmoalfFkqPBxbn/y9cEWse3hl5OEyUUkKZf9Ej/y2DO5+WLhuLDuIvlkx4LT+imCU+Ptl9kklN7nG1FRzPDemE73tgdB04t89/1O/w1cDnyilFU=';

    if (!channelAccessToken) {
      return res.status(400).json({ success: false, message: 'Missing Channel Access Token' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing messages array' });
    }

    const isPush = Boolean(targetId && typeof targetId === 'string' && targetId.trim().length > 0);
    const lineEndpoint = isPush
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast';

    const lineBody = isPush
      ? { to: targetId.trim(), messages }
      : { messages };

    const lineRes = await fetch(lineEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken.trim()}`,
      },
      body: JSON.stringify(lineBody),
    });

    if (lineRes.ok) {
      const data = await lineRes.json().catch(() => ({}));
      return res.status(200).json({
        success: true,
        message: isPush ? `ส่งแจ้งเตือนไปที่ (${targetId}) สำเร็จ!` : 'ส่งแจ้งเตือน Broadcast เข้า LINE สำเร็จ!',
        data,
      });
    } else {
      const errText = await lineRes.text();
      return res.status(lineRes.status).json({
        success: false,
        message: `LINE API Error (${lineRes.status}): ${errText}`,
        error: errText,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  }
}
