import { useParams } from 'react-router-dom';
import { User, PawPrint, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';

export function ProfilePage() {
  const { username } = useParams();

  return (
    <section className="space-y-8 py-10">
      {/* Hero del perfil */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple/10 via-cream to-turquoise/10 border-2 border-navy/10 p-8 shadow-md">
        <div className="blob-decoration absolute top-5 right-5 w-24 h-24 bg-orange/20" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange to-turquoise flex items-center justify-center text-white text-4xl font-display font-extrabold shadow-lg">
            {username?.[0]?.toUpperCase() || 'U'}
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <User className="h-5 w-5 text-navy/60" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Perfil público</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold text-navy mb-2">
              @{username ?? 'usuario'}
            </h1>
            <p className="text-navy/70">
              Miembro de la comunidad Patitas
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-orange/20 bg-orange/5 p-6 text-center">
          <PawPrint className="h-8 w-8 text-orange mx-auto mb-2" />
          <p className="font-display text-3xl font-extrabold text-navy">0</p>
          <p className="text-sm font-medium text-navy/70">Publicaciones</p>
        </div>
        
        <div className="rounded-2xl border-2 border-turquoise/20 bg-turquoise/5 p-6 text-center">
          <MapPin className="h-8 w-8 text-turquoise mx-auto mb-2" />
          <p className="font-display text-3xl font-extrabold text-navy">0</p>
          <p className="text-sm font-medium text-navy/70">Casos activos</p>
        </div>
        
        <div className="rounded-2xl border-2 border-purple/20 bg-purple/5 p-6 text-center">
          <PawPrint className="h-8 w-8 text-purple mx-auto mb-2" />
          <p className="font-display text-3xl font-extrabold text-navy">0</p>
          <p className="text-sm font-medium text-navy/70">Resueltos</p>
        </div>
      </div>

      {/* Contenido próximamente */}
      <div className="rounded-3xl border-2 border-navy/10 bg-white p-12 text-center shadow-md">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-navy/40" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-navy">
            Perfil en construcción
          </h2>
          <p className="text-navy/70">
            Pronto podrás ver las publicaciones y la actividad de <strong>@{username}</strong> en la comunidad.
          </p>
          <Button variant="ghost">
            Volver al inicio
          </Button>
        </div>
      </div>
    </section>
  );
}