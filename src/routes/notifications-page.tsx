import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Eye, Heart, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../app/auth-context';
import { Button } from '../components/ui/button';
import { PawLoader } from '../components/ui/paw-loader';
import { EmptyState } from '../components/ui/empty-state';
import { getNotifications, markNotificationAsRead, type NotificationItem } from '../lib/supabase/notifications';
import { supabase } from '../lib/supabase/client';
import { setPageMeta } from '../lib/seo/page-meta';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  MATCH: <Eye className="h-5 w-5 text-orange" />,
  COMMENT: <MessageCircle className="h-5 w-5 text-turquoise" />,
  SIGHTING: <Eye className="h-5 w-5 text-purple" />,
  ADOPTION_REQUEST: <Heart className="h-5 w-5 text-purple" />,
  PUBLICATION_RESOLVED: <CheckCircle className="h-5 w-5 text-found" />,
  SYSTEM: <AlertCircle className="h-5 w-5 text-navy" />,
};

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Notificaciones — Patitas',
      description: 'Mantente al día con las actualizaciones de tus casos publicados.',
      canonicalPath: '/notificaciones',
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      const data = await getNotifications(user.id);

      if (active) {
        setNotifications(data);
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `profile_id=eq.${user.id}` }, async () => {
        const freshNotifications = await getNotifications(user.id);
        setNotifications(freshNotifications);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (authLoading || loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] gap-4 py-8">
        <PawLoader size="lg" />
        <p className="font-display text-lg font-semibold text-navy">Cargando notificaciones...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="py-10">
        <div className="max-w-2xl mx-auto rounded-3xl border-2 border-navy/10 bg-white p-8 shadow-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-orange" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-navy mb-3">
            Debes iniciar sesión
          </h2>
          <p className="text-navy/70 mb-6">
            Inicia sesión para ver tus notificaciones y mantenerte al día.
          </p>
          <Link to="/auth/login">
            <Button variant="primary">Iniciar sesión</Button>
          </Link>
        </div>
      </section>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <section className="space-y-8 py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange/10 via-cream to-turquoise/10 border-2 border-navy/10 p-8 shadow-md">
        <div className="blob-decoration absolute top-5 right-5 w-24 h-24 bg-purple/20" />
        
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-orange animate-paw-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Actividad</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-navy">
            Notificaciones
          </h1>
          <p className="text-lg text-navy/70 max-w-2xl">
            Coincidencias, comentarios y actualizaciones en tiempo real.
          </p>
          
          {unreadCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-pill bg-orange/10 border border-orange/20 px-4 py-2 text-sm font-bold text-orange">
              <span className="w-2 h-2 rounded-full bg-orange animate-paw-pulse" />
              {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
            </div>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      {notifications.length === 0 ? (
        <EmptyState
          title="No tienes notificaciones"
          description="Cuando haya actividad en tus casos, aparecerán aquí."
          illustration="cat"
          action={
            <Link to="/publicar">
              <Button variant="primary">Publicar un caso</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={[
                "group rounded-2xl border-2 p-5 shadow-md transition-all duration-base hover:shadow-lg hover:-translate-y-1",
                notification.is_read 
                  ? "border-navy/10 bg-white" 
                  : "border-orange/20 bg-orange/5"
              ].join(' ')}
            >
              <div className="flex gap-4">
                {/* Icono */}
                <div className={[
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  notification.is_read ? "bg-navy/5" : "bg-orange/10"
                ].join(' ')}>
                  {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.SYSTEM}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-lg font-extrabold text-navy">
                      {notification.title}
                    </h3>
                    <span className="shrink-0 rounded-full bg-navy/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy/70">
                      {notification.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-navy/70 leading-relaxed mb-4">
                    {notification.body}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {notification.link && (
                      <Link to={notification.link}>
                        <Button variant="ghost" className="text-sm">
                          Ver detalles →
                        </Button>
                      </Link>
                    )}
                    
                    {!notification.is_read && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-sm"
                        onClick={async () => {
                          await markNotificationAsRead(notification.id, user.id);
                          setNotifications((current) => 
                            current.map((item) => 
                              item.id === notification.id 
                                ? { ...item, is_read: true } 
                                : item
                            )
                          );
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marcar como leída
                      </Button>
                    )}
                    
                    <span className="text-xs text-navy/50 ml-auto">
                      {new Date(notification.created_at).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}