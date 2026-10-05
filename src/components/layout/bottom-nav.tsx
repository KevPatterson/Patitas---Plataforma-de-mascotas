import { NavLink } from 'react-router-dom';
import { Home, Search, MapPinned, PlusCircle, User } from 'lucide-react';

const items = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/mapa', label: 'Mapa', icon: MapPinned },
  { to: '/publicar', label: 'Publicar', icon: PlusCircle },
  { to: '/perfil/usuario', label: 'Perfil', icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#CFEFE6] bg-[#F5FBF9]/95 px-2 py-2 backdrop-blur-xl md:hidden" aria-label="Navegación móvil">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-center text-[10px] font-semibold transition',
                  isActive
                    ? 'bg-[#0B3B3C] text-white shadow-sm'
                    : 'text-[#0B3B3C]/60 hover:bg-[#0B3B3C]/5 hover:text-[#0B3B3C]',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
