import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase-admin';
import { checkRateLimit, extractToken, verifyAuth } from '../_lib/rate-limit-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 10 publicaciones por hora
  if (!checkRateLimit(req, res, 'publication-create', 10, 3600_000)) {
    return;
  }

  const token = extractToken(req);
  const { user, error: authError } = await verifyAuth(token, supabaseAdmin);

  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' });
  }

  let payload: Record<string, unknown> = {};

  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Validaciones básicas server-side
  if (!payload.title || !payload.description || !payload.type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // La creación real se hace desde el cliente con RLS
  // Este endpoint sirve principalmente para rate limiting y validación adicional
  return res.status(200).json({ ok: true, message: 'Publication can be created' });
}
