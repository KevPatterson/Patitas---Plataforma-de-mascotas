import { supabase } from './client';

export type NotificationType = 'MATCH' | 'REPORT' | 'MESSAGE' | 'PUBLICATION_UPDATE' | 'SYSTEM';

export type Notification = {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

/**
 * Obtener todas las notificaciones del usuario autenticado
 */
export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as Notification[]) || [];
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function getUnreadCount(): Promise<number> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Marcar una notificación como leída
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllAsRead(): Promise<void> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('profile_id', user.id)
    .eq('is_read', false);

  if (error) {
    throw error;
  }
}

/**
 * Eliminar una notificación
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

/**
 * Crear una notificación (solo para uso interno/server-side)
 */
export async function createNotification(input: {
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      profile_id: input.profileId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
      is_read: false,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

/**
 * Suscribirse a notificaciones en tiempo real
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
