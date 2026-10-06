import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, type LucideIcon } from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../app/auth-context';
import { getUnreadNotificationsCount } from '../../lib/supabase/notifications';

type SiteShellProps = {
  children: React.ReactNode;
};

function NavItem({ href, label, Icon, badge }: { href: string; label: string; Icon: LucideIcon; badge?: number }) {
  const location = useLocation();
  const isActive = location.pathname === href || (href !== '/' && location.pathname.startsWith(href + '/'));
  return (
    <Link
      to={href}
      className={[
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
        isActive
          ? 'bg-[#0F3D33] text-white'
          : 'text-[#0B3B3C]/70 hover:bg-[#0B3B3C]/5 hover:text-[#0B3B3C] dark:text-[#F5FBF9]/70 dark:hover:bg-white/10',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
      {badge && badge > 0 && (
        <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-(--color-danger) text-white text-[10px] font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export function SiteShell({ children }: SiteShellProps) {
  const { user, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationsCount(user.id);
        if (active) setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, authLoading]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5FBF9] dark:bg-[#0B3B3C] dark:text-[#F5FBF9]">
      <header className="sticky top-0 z-40 border-b-2 border-[#CFEFE6] bg-[#F5FBF9]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F5FBF9]/80 dark:border-white/10 dark:bg-[#0B3B3C]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-[#0B3B3C] no-underline dark:text-[#F5FBF9]" aria-label="Patitas - inicio">
            <Logo variant="full" size={36} />
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
            <NavItem href="/buscar" label="Buscar" Icon={Bell} />
            <NavItem href="/mapa" label="Mapa" Icon={Bell} />
            <Link
              to="/publicar"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[20px] bg-[#FF6B35] px-5 py-2 text-sm font-extrabold text-[#0B3B3C] shadow-sm transition hover:brightness-95"
              style={{ fontFamily: '"Baloo 2", cursive' }}
            >
              Publicar
            </Link>
            {user && (
              <NavItem href="/notificaciones" label="Notificaciones" Icon={Bell} badge={unreadCount} />
            )}
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
            <Link to="/buscar" className="hover:text-white">Buscar</Link>
            <Link to="/adopciones" className="hover:text-white">Adopciones</Link>
            <Link to="/mapa" className="hover:text-white">Mapa</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}