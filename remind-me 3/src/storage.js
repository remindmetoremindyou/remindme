import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'remindme.reminders.v1';

/*
Reminder shape:
{
  id, title,
  type: 'near' | 'leave',
  places: [{ name, lat, lng }],      // type 'near': one or more stores
  radius: 300,                       // metres, type 'near'
  where: 'Kitchen counter',          // type 'leave'
  home: { lat, lng },                // type 'leave'
  when: ISO string | null,           // optional date and time
  repeat: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly',
  done: false, lastFired: number | null, notifIds: []
}
*/

export async function loadReminders() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveReminders(list) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function updateReminder(id, patch) {
  const list = await loadReminders();
  const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
  await saveReminders(next);
  return next;
}
