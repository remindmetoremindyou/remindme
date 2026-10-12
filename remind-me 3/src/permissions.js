import * as Location from 'expo-location';
import { ensureNotificationPermission } from './notifications';

// Returns { ok, reason }. 'Always' location is required for alerts while the app is closed.
export async function ensurePermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { ok: false, reason: 'location' };
  const bg = await Location.requestBackgroundPermissionsAsync();
  const notif = await ensureNotificationPermission();
  if (bg.status !== 'granted') return { ok: false, reason: 'always' };
  if (!notif) return { ok: false, reason: 'notifications' };
  return { ok: true, reason: null };
}
