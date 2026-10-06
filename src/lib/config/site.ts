// Configuración central del sitio - dominio canónico
// Evita referencias hardcodeadas a previews como patitass.vercel.app

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://patitass.vercel.app';

export const SITE_NAME = 'Patitas';
export const SITE_DESCRIPTION = 'Plataforma comunitaria para reencontrar mascotas perdidas, reportar encontradas y promover adopciones responsables.';
