// Background tasks. Import this file once at the top of App.js so the tasks are
// registered at startup, even when the OS wakes the app in the background.
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { GEOFENCE_TASK, MOVE_TASK, COOLDOWN_MS } from './constants';
import { loadReminders, updateReminder } from './storage';
import { notifyNow } from './notifications';
import { syncGeofences } from './geofence';

const HOUR = 3600 * 1000;

// If a reminder has a date/time, location alerts only fire in the 3 hours after it.
function isActiveNow(r, now = new Date()) {
  if (!r.when) return true;
  const t = new Date(r.when);
  if (r.repeat === 'none') return now >= t && now - t <= 3 * HOUR;
  const start = new Date(now);
  start.setHours(t.getHours(), t.getMinutes(), 0, 0);
  const day = now.getDay();
  const dayOk =
    r.repeat === 'daily' ||
    (r.repeat === 'weekdays' && day >= 1 && day <= 5) ||
    (r.repeat === 'weekly' && day === t.getDay()) ||
    (r.repeat === 'monthly' && now.getDate() === t.getDate());
  return dayOk && now >= start && now - start <= 3 * HOUR;
}

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { eventType, region } = data;
  const [id, kind] = region.identifier.split(':');

  const r = (await loadReminders()).find((x) => x.id === id);
  if (!r || r.done || !isActiveNow(r)) return;
  if (r.lastFired && Date.now() - r.lastFired < COOLDOWN_MS) return;

  if (kind === 'leave' && eventType === Location.GeofencingEventType.Exit) {
    const spot = r.where ? ` It's ${/^(the|on|in)\b/i.test(r.where) ? '' : 'at the '}${r.where.toLowerCase()}.` : '';
    await notifyNow(`Did you get your ${r.title.toLowerCase()}?`, `You just left home.${spot}`);
  } else if (kind !== 'leave' && eventType === Location.GeofencingEventType.Enter) {
    const place = r.places[Number(kind)];
    await notifyNow(r.title, `You're near ${place ? place.name : 'your pinned place'}.`);
  } else {
    return;
  }
  await updateReminder(id, { lastFired: Date.now() });
});

TaskManager.defineTask(MOVE_TASK, async ({ error }) => {
  if (error) return;
  await syncGeofences();
});
