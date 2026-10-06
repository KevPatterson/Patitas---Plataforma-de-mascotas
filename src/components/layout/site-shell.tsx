import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, MapPin, PlusCircle, LogOut, User, type LucideIcon } from 'lucide-react';
import { signOut } from '../../lib/supabase/auth';
import { useAuth } from '../../app/auth-context';
import { getUnreadNotificationsCount } from '../../lib/supabase/notifications';
import { supabase } from '../../lib/supabase/client';
import { Logo } from '../Logo';

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
        'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-base ease-smooth relative',
        isActive
          ? 'bg-navy text-white shadow-md'
          : 'text-navy/70 hover:bg-navy/5 hover:text-navy hover:scale-105',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
      {(badge ?? 0) > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-lost text-white text-[10px] font-bold shadow-sm animate-paw-pulse">
          {(badge ?? 0) > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export function SiteShell({ children }: SiteShellProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoggingOut(false);
    }
  };
  const username = (user?.user_metadata?.username as string | undefined) ?? null;
  const profileHref = username ? `/perfil/${username}` : '/dashboard';

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

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (!error && data && active) {
          setAvatarUrl(data.avatar_url);
        }
      } catch {
        if (active) setAvatarUrl(null);
      }
    };

    fetchCount();
    fetchProfile();
    const interval = setInterval(fetchCount, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, authLoading]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Header con nueva estética */}
      <header className="sticky top-0 z-40 border-b-2 border-navy/10 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link 
            to="/" 
            className="flex items-center gap-3 text-navy no-underline transition-transform duration-base hover:scale-105" 
            aria-label="Patitas - inicio"
          >
            <Logo variant="full" size={36} animated />
          </Link>
          
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
              <NavItem href="/buscar" label="Buscar" Icon={Search} />
              <NavItem href="/mapa" label="Mapa" Icon={MapPin} />
              
              {/* CTA destacado */}
              <Link
                to="/publicar"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-base ease-smooth hover:shadow-lg hover:scale-105 hover:bg-orange-dark active:scale-95"
                style={{ fontFamily: '"Baloo 2", cursive' }}
              >
                <PlusCircle className="size-4 transition-transform duration-base group-hover:rotate-90" aria-hidden="true" />
                Publicar
              </Link>
              
              {user && (
                <NavItem href="/notificaciones" label="Notificaciones" Icon={Bell} badge={unreadCount} />
              )}
            </nav>
            {/* Acciones de autenticación - siempre visibles */}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={profileHref}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-navy/10 bg-white px-4 py-2.5 text-sm font-bold text-navy transition-all duration-base ease-smooth hover:bg-navy/5 hover:scale-105 active:scale-95"
                    aria-label="Mi perfil"
                  >
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="size-6 rounded-lg object-cover border border-navy/10"
                      />
                    ) : (
                      <User className="size-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-navy/10 bg-white px-4 py-2.5 text-sm font-bold text-navy transition-all duration-base ease-smooth hover:bg-navy/5 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{loggingOut ? 'Saliendo...' : 'Salir'}</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-base ease-smooth hover:bg-navy/90 hover:scale-105 active:scale-95"
                >
                  Entrar
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer rediseñado con personalidad */}
      <footer className="relative border-t-2 border-navy/10 bg-navy text-cream overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 size-20">
            <svg viewBox="0 0 120 120" fill="currentColor">
              <ellipse cx="24" cy="48" rx="9" ry="12" transform="rotate(-22 24 48)" />
              <ellipse cx="45" cy="28" rx="9" ry="13" transform="rotate(-8 45 28)" />
              <ellipse cx="75" cy="28" rx="9" ry="13" transform="rotate(8 75 28)" />
              <ellipse cx="96" cy="48" rx="9" ry="12" transform="rotate(22 96 48)" />
              <path d="M60 110 C60 110 33 91 33 74 C33 62 44 54 60 54 C76 54 87 62 87 74 C87 91 60 110 60 110Z" />
            </svg>
          </div>
          <div className="absolute bottom-10 right-20 size-16 transform rotate-12">
            <svg viewBox="0 0 120 120" fill="currentColor">
              <ellipse cx="24" cy="48" rx="9" ry="12" transform="rotate(-22 24 48)" />
              <ellipse cx="45" cy="28" rx="9" ry="13" transform="rotate(-8 45 28)" />
              <ellipse cx="75" cy="28" rx="9" ry="13" transform="rotate(8 75 28)" />
              <ellipse cx="96" cy="48" rx="9" ry="12" transform="rotate(22 96 48)" />
              <path d="M60 110 C60 110 33 91 33 74 C33 62 44 54 60 54 C76 54 87 62 87 74 C87 91 60 110 60 110Z" />
            </svg>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-cream">
              <Logo variant="full" size={32} className="text-cream" />
            </div>
            <p className="max-w-md font-display text-lg leading-relaxed text-cream/90">
              🐾 Cada patita merece volver a casa
            </p>
            <p className="text-sm text-cream/60">
              Plataforma comunitaria · Hecho con ❤️ en Cuba
            </p>
          </div>
          
          <nav className="flex flex-col gap-2 text-sm font-semibold" aria-label="Enlaces del pie">
            <Link 
              to="/buscar" 
              className="text-cream/80 hover:text-orange transition-colors duration-base"
            >
              Buscar mascotas
            </Link>
            <Link 
              to="/adopciones" 
              className="text-cream/80 hover:text-purple transition-colors duration-base"
            >
              Adopciones
            </Link>
            <Link 
              to="/mapa" 
              className="text-cream/80 hover:text-turquoise transition-colors duration-base"
            >
              Mapa de casos
            </Link>
            <Link 
              to="/como-funciona" 
              className="text-cream/80 hover:text-cream transition-colors duration-base"
            >
              Cómo funciona
            </Link>
          </nav>
        </div>

        {/* Barra decorativa inferior */}
        <div className="h-2 bg-linear-to-r from-orange via-turquoise to-purple" />
      </footer>
    </div>
  );
}