import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { Button } from '../components/ui/button';
import { getNotifications, markNotificationAsRead, type NotificationItem } from '../lib/supabase/notifications';
import { supabase } from '../lib/supabase/client';

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="soft-panel rounded-4xl p-6">Cargando notificaciones...</div>;
  }

  if (!user) {
    return (
      <div className="soft-panel rounded-4xl p-6">
        <p className="font-semibold text-(--color-text)">Debes entrar para ver tus notificaciones.</p>
        <Link className="mt-3 inline-block text-sm font-semibold text-(--color-primary) hover:underline" to="/auth/login">
          Ir al acceso
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--color-muted)">Notificaciones</p>
        <h1 className="font-display text-4xl font-semibold text-(--color-text)">Actividad relevante</h1>
        <p className="text-(--color-muted)">Aquí verás coincidencias, respuestas y actualizaciones importantes en tiempo real.</p>
      </div>

      <div className="soft-panel rounded-4xl p-6 space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-2xl border border-black/5 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-(--color-text)">{notification.title}</p>
              <span className="rounded-full bg-[rgba(15,61,51,0.08)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-(--color-primary)">
                {notification.type}
              </span>
            </div>
            <p className="mt-2 text-sm text-(--color-muted)">{notification.body}</p>
            <div className="mt-3 flex items-center gap-3">
              {notification.link ? (
                <Link className="text-sm font-semibold text-(--color-primary) hover:underline" to={notification.link}>
                  Abrir
                </Link>
              ) : null}
              {!notification.is_read ? (
                <Button type="button" variant="ghost" onClick={async () => {
                  await markNotificationAsRead(notification.id, user.id);
                  setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
                }}>
                  Marcar como leída
                </Button>
              ) : null}
            </div>
          </div>
        ))}

        {notifications.length === 0 ? <p className="text-sm text-(--color-muted)">No tienes notificaciones todavía.</p> : null}
      </div>
    </section>
  );
}