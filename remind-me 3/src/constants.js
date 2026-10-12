export const GEOFENCE_TASK = 'remindme-geofence';
export const MOVE_TASK = 'remindme-move';

// iOS allows 20 monitored regions per app. We always monitor the nearest ones
// and re-pick them as you move (see geofence.js).
export const MAX_GEOFENCES = 20;

// "Left behind" reminders alert when you LEAVE home. Phone geofences are not
// reliable below roughly 100 m, so this is larger than 100 ft (30 m).
// A Bluetooth tag on the item would be needed for true 100 ft accuracy.
export const LEAVE_RADIUS_M = 100;

// Don't re-alert for the same reminder more often than this.
export const COOLDOWN_MS = 30 * 60 * 1000;

export const REPEAT_LABELS = {
  none: "Doesn't repeat",
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekly: 'Every week',
  monthly: 'Every month',
};
