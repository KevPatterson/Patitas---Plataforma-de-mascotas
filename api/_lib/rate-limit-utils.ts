import type { VercelRequest } from '@vercel/node';

type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export const rateLimits: Record<string, RateLimitConfig> = {
  auth: { max: 5, windowMs: 60_000 }, // 5 intentos por minuto
  publication: { max: 3, windowMs: 300_000 }, // 3 publicaciones cada 5 minutos
  upload: { max: 10, windowMs: 300_000 }, // 10 subidas cada 5 minutos
  report: { max: 5, windowMs: 300_000 }, // 5 reportes cada 5 minutos
  moderation: { max: 20, windowMs: 60_000 }, // 20 acciones por minuto
};

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  return Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0] ?? req.socket.remoteAddress ?? 'unknown';
}

export function buildRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
