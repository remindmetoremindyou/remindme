# Remind Me

Location-based reminders. Pin one or more stores and get alerted when you're close,
get a "Did you get your lunch?" alert when you leave home, and add an optional date,
time, and repeat to any reminder.

## Set up

```bash
npx create-expo-app@latest remind-me --template blank
cd remind-me
npx expo install expo-location expo-task-manager expo-notifications \
  @react-native-async-storage/async-storage react-native-maps \
  @react-native-community/datetimepicker expo-dev-client
```

Then copy these files from this folder into the new project, replacing the defaults:
`App.js`, `app.json`, and the whole `src/` folder.

In `app.json`, replace `YOUR_GOOGLE_MAPS_API_KEY` (Android only) and change the
`com.example.remindme` identifiers to your own.

## Run it on a phone

Background location and geofencing do **not** work in Expo Go. Use a development build:

```bash
npx expo run:ios       # needs a Mac with Xcode
npx expo run:android   # needs Android Studio
```

(or `eas build --profile development` if you use EAS).

On first launch, allow notifications and set location to **Always**.

## How it works

| File | What it does |
| --- | --- |
| `src/tasks.js` | Background tasks. Fires the alert when you enter a store zone or leave home. |
| `src/geofence.js` | Registers zones with the OS. Keeps the 20 nearest (iOS limit) and re-picks as you move. |
| `src/notifications.js` | Immediate alerts and scheduled date/time/repeat alerts. |
| `src/storage.js` | Saves reminders on the device. No account or server. |
| `src/screens/*` | Reminders list, map, and the new-reminder form. |
| `src/constants.js` | Leave-home radius, cooldown between alerts, geofence cap. |

## Behaviors to know

- **Left behind reminders** alert when you leave home, using a 100 m zone. Phone geofences
  aren't reliable at 100 ft, and GPS is weak indoors. Change `LEAVE_RADIUS_M` in
  `src/constants.js` to experiment. A Bluetooth tag is the way to get true 100 ft.
- If a reminder has a date/time, its location alerts only fire in the 3 hours after that time.
- Each reminder alerts at most once per 30 minutes (`COOLDOWN_MS`).
- Place reminders stay active until you check them off.
- Long-press a reminder to delete it.

## Next steps

1. Test on a real phone by walking or driving past a pinned place.
2. Add snooze and "Mark done" buttons directly on the notification.
3. Add a Bluetooth tag option for true 100 ft left-behind alerts.
4. Optional cloud sync and sign-in.
