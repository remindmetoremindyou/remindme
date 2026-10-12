import * as Location from 'expo-location';
import { GEOFENCE_TASK, MOVE_TASK, MAX_GEOFENCES, LEAVE_RADIUS_M } from './constants';
import { loadReminders } from './storage';

export function distance(a, b) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Registers the regions the OS should watch. Leave-home regions always get a slot;
// the remaining slots go to the nearest store/place pins.
export async function syncGeofences() {
  const list = (await loadReminders()).filter((r) => !r.done);

  let here = null;
  try {
    const last = await Location.getLastKnownPositionAsync();
    here = last ? last.coords : null;
  } catch {}

  const leave = list
    .filter((r) => r.type === 'leave' && r.home)
    .map((r) => ({
      identifier: `${r.id}:leave`,
      latitude: r.home.lat,
      longitude: r.home.lng,
      radius: LEAVE_RADIUS_M,
      notifyOnEnter: false,
      notifyOnExit: true,
    }));

  const near = [];
  list
    .filter((r) => r.type === 'near')
    .forEach((r) =>
      r.places.forEach((p, i) =>
        near.push({
          identifier: `${r.id}:${i}`,
          latitude: p.lat,
          longitude: p.lng,
          radius: r.radius,
          notifyOnEnter: true,
          notifyOnExit: false,
          _d: here ? distance(here, { latitude: p.lat, longitude: p.lng }) : 0,
        })
      )
    );
  near.sort((a, b) => a._d - b._d);

  const room = Math.max(0, MAX_GEOFENCES - leave.length);
  const regions = [...leave, ...near.slice(0, room).map(({ _d, ...rg }) => rg)];

  const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (!regions.length) {
    if (started) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

// Low-power background updates, used only to re-pick the nearest regions as you travel.
export async function startMoveWatcher() {
  const running = await Location.hasStartedLocationUpdatesAsync(MOVE_TASK);
  if (running) return;
  await Location.startLocationUpdatesAsync(MOVE_TASK, {
    accuracy: Location.Accuracy.Low,
    distanceInterval: 1000,
    pausesUpdatesAutomatically: true,
    foregroundService: {
      notificationTitle: 'Remind Me',
      notificationBody: 'Watching for your reminders.',
    },
  });
}
