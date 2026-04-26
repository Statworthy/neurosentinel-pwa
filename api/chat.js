// Serverless proxy for Anthropic Claude API.
// The browser POSTs the same shape it would send to https://api.anthropic.com/v1/messages,
// and this function injects the secret API key server-side so it never reaches the client.

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  }
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Request body must include a messages array.' });
  }

  const payload = {
    model: body.model || 'claude-opus-4-7',
    max_tokens: Math.min(Number(body.max_tokens) || 1000, 4000),
    messages: body.messages,
    ...(body.system ? { system: body.system } : {}),
    ...(body.temperature != null ? { temperature: body.temperature } : {}),
  };

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed', detail: String(err) });
  }
}
