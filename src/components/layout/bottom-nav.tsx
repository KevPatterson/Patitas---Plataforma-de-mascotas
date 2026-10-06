import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, MapPinned, PlusCircle, User, Bell } from 'lucide-react';
import { useAuth } from '../../app/auth-context';
import { getUnreadNotificationsCount } from '../../lib/supabase/notifications';
import { useEffect, useState } from 'react';

const items = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/mapa', label: 'Mapa', icon: MapPinned },
  { to: '/publicar', label: 'Publicar', icon: PlusCircle },
  { to: '/notificaciones', label: 'Notifs', icon: Bell },
  { to: '/perfil/usuario', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#CFEFE6] bg-[#F5FBF9]/95 px-2 py-2 backdrop-blur-xl md:hidden" aria-label="Navegación móvil">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
          const showBadge = item.to === '/notificaciones' && unreadCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={[
                'flex flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-center text-[10px] font-semibold transition relative',
                isActive
                  ? 'bg-[#0B3B3C] text-white shadow-sm'
                  : 'text-[#0B3B3C]/60 hover:bg-[#0B3B3C]/5 hover:text-[#0B3B3C]',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
              {showBadge && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-(--color-danger) text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}