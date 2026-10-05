import { supabase } from './client';

export type NotificationItem = {
  id: string;
  type: 'MATCH' | 'REPORT' | 'MESSAGE' | 'PUBLICATION_UPDATE' | 'SYSTEM';
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export async function getNotifications(profileId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
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