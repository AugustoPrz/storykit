import type { VercelRequest, VercelResponse } from '@vercel/node';

const EVOLINK_BASE = 'https://api.evolink.ai/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pathSegments = req.query.path;
  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments || '';
  const targetUrl = `${EVOLINK_BASE}/${path}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers,
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: { message: `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}` },
    });
  }
}
