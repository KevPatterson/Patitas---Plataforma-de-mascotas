import type { ReactNode } from 'react';
import { Logo } from '../Logo';

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF9] dark:bg-[#0B3B3C] dark:text-[#F5FBF9]">
      <header className="sticky top-0 z-40 border-b-2 border-[#CFEFE6] bg-[#F5FBF9]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F5FBF9]/80 dark:border-white/10 dark:bg-[#0B3B3C]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 text-[#0B3B3C] no-underline dark:text-[#F5FBF9]" aria-label="Patitas - inicio">
            <Logo variant="full" size={36} />
          </a>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
            <a
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#0B3B3C]/70 transition hover:bg-[#0B3B3C]/5 hover:text-[#0B3B3C] dark:text-[#F5FBF9]/70 dark:hover:text-[#F5FBF9]"
              href="/buscar"
            >
              Buscar
            </a>
            <a
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#0B3B3C]/70 transition hover:bg-[#0B3B3C]/5 hover:text-[#0B3B3C] dark:text-[#F5FBF9]/70 dark:hover:text-[#F5FBF9]"
              href="/mapa"
            >
              Mapa
            </a>
            <a
              className="inline-flex min-h-[44px] items-center justify-center rounded-[20px] bg-[#FF6B35] px-5 py-2 text-sm font-extrabold text-[#0B3B3C] shadow-sm transition hover:brightness-95"
              href="/publicar"
              style={{ fontFamily: '"Baloo 2", cursive' }}
            >
              Publicar
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t-2 border-[#CFEFE6] bg-[#0B3B3C] text-[#CFEFE6] dark:border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[#F5FBF9]">
            <Logo variant="full" size={28} className="text-[#F5FBF9]" />
          </div>
          <p className="max-w-md text-sm leading-6 text-[#CFEFE6]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            Que ninguna patita se quede sin casa.
            <span className="block text-xs opacity-80">Plataforma comunitaria · Hecho con cercanía en Cuba</span>
          </p>
          <nav className="flex gap-4 text-xs font-semibold tracking-wide" aria-label="Enlaces del pie">
            <a href="/buscar" className="hover:text-white">
              Buscar
            </a>
            <a href="/adopciones" className="hover:text-white">
              Adopciones
            </a>
            <a href="/mapa" className="hover:text-white">
              Mapa
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
