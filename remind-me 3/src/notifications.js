import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export function notifyNow(title, body) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

// Schedules the optional date/time alert. Returns notification ids so they can
// be cancelled when the reminder is completed or deleted.
export async function scheduleTimed(r) {
  if (!r.when) return [];
  const d = new Date(r.when);
  const hour = d.getHours();
  const minute = d.getMinutes();
  const T = Notifications.SchedulableTriggerInputTypes;
  const content = { title: r.title, body: 'Time for your reminder.', sound: true };
  const triggers = [];

  if (r.repeat === 'none') {
    if (d.getTime() > Date.now()) triggers.push({ type: T.DATE, date: d });
  } else if (r.repeat === 'daily') {
    triggers.push({ type: T.DAILY, hour, minute });
  } else if (r.repeat === 'weekdays') {
    for (let weekday = 2; weekday <= 6; weekday++) {
      triggers.push({ type: T.WEEKLY, weekday, hour, minute }); // 1 = Sunday
    }
  } else if (r.repeat === 'weekly') {
    triggers.push({ type: T.WEEKLY, weekday: d.getDay() + 1, hour, minute });
  } else if (r.repeat === 'monthly') {
    triggers.push(
      Platform.OS === 'ios'
        ? { type: T.CALENDAR, repeats: true, day: d.getDate(), hour, minute }
        : { type: T.MONTHLY, day: d.getDate(), hour, minute }
    );
  }

  const ids = [];
  for (const trigger of triggers) {
    ids.push(await Notifications.scheduleNotificationAsync({ content, trigger }));
  }
  return ids;
}

export async function cancelIds(ids = []) {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
}
