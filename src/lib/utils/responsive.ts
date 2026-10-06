/**
 * Utilidades para responsive design y media queries
 */

export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook personalizado para detectar el breakpoint actual
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') return 'lg';

  const width = window.innerWidth;

  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints['2xl']) return 'xl';
  if (width < breakpoints['3xl']) return '2xl';
  return '3xl';
}

/**
 * Verificar si estamos en móvil
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
}

/**
 * Verificar si estamos en tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
}

/**
 * Verificar si estamos en desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.lg;
}

/**
 * Clamp value entre min y max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Responsive spacing basado en viewport
 * Útil para ajustar padding/margin dinámicamente
 */
export function responsiveSpacing(base: number, scale: number = 1): string {
  if (typeof window === 'undefined') return `${base}px`;
  
  const width = window.innerWidth;
  const minWidth = breakpoints.xs;
  const maxWidth = breakpoints['2xl'];
  
  // Escala lineal entre minWidth y maxWidth
  const factor = clamp((width - minWidth) / (maxWidth - minWidth), 0, 1);
  const scaled = base + (base * scale * factor);
  
  return `${Math.round(scaled)}px`;
}

/**
 * Detectar orientación del dispositivo
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Detectar si es touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Safe area insets para dispositivos con notch
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}
