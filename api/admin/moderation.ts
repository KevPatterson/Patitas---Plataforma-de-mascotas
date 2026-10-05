import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase-admin';
import { consumeRateLimit } from '../_lib/rate-limit';

type ModerationAction = 'resolve-report' | 'hide-publication' | 'restore-publication';

function json(res: VercelResponse, statusCode: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(statusCode).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] ?? req.socket.remoteAddress ?? 'unknown';
  const rateKey = `moderation:${ip}`;
  const rate = consumeRateLimit(rateKey, 20, 60_000);

  if (!rate.allowed) {
    res.setHeader('Retry-After', Math.ceil((rate.resetAt - Date.now()) / 1000).toString());
    return json(res, 429, { error: 'Too many requests' });
  }

  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return json(res, 401, { error: 'Missing authorization token' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return json(res, 401, { error: 'Invalid session' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile || (profile.role !== 'MODERATOR' && profile.role !== 'ADMIN')) {
    return json(res, 403, { error: 'Forbidden' });
  }

  let payload: { action?: ModerationAction; id?: string } = {};

  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as typeof payload);
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  if (!payload.action || !payload.id) {
    return json(res, 400, { error: 'Missing action or id' });
  }

  if (payload.action === 'resolve-report') {
    const { error } = await supabaseAdmin
      .from('reports')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
        resolved_by: userData.user.id,
      })
      .eq('id', payload.id);

    if (error) {
      return json(res, 500, { error: error.message });
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_profile_id: userData.user.id,
      action: 'resolve-report',
      entity_type: 'report',
      entity_id: payload.id,
      metadata: {},
    });

    return json(res, 200, { ok: true });
  }

  if (payload.action === 'hide-publication' || payload.action === 'restore-publication') {
    const nextStatus = payload.action === 'hide-publication' ? 'HIDDEN' : 'ACTIVE';

    const { error } = await supabaseAdmin.from('publications').update({ status: nextStatus }).eq('id', payload.id);

    if (error) {
      return json(res, 500, { error: error.message });
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_profile_id: userData.user.id,
      action: payload.action,
      entity_type: 'publication',
      entity_id: payload.id,
      metadata: {},
    });

    return json(res, 200, { ok: true });
  }

  return json(res, 400, { error: 'Unknown action' });
}