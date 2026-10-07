import { supabase } from './client';

export type NotificationItem = {
  id: string;
  type: 'MATCH' | 'REPORT' | 'MESSAGE' | 'PUBLICATION_UPDATE' | 'SYSTEM';
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export async function getNotifications(profileId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at, read_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationItem[];
}

export async function markNotificationAsRead(notificationId: string, profileId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('profile_id', profileId);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead(profileId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }
}

export async function getUnreadNotificationsCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function createNotification(input: {
  profileId: string;
  type: NotificationItem['type'];
  title: string;
  body: string;
  link?: string;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      profile_id: input.profileId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: NotificationItem) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as NotificationItem);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
