import './src/tasks'; // must be first: registers background tasks
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { loadReminders, saveReminders } from './src/storage';
import { cancelIds, scheduleTimed } from './src/notifications';
import { ensurePermissions } from './src/permissions';
import { startMoveWatcher, syncGeofences } from './src/geofence';
import ListScreen from './src/screens/ListScreen';
import MapScreen from './src/screens/MapScreen';
import NewScreen from './src/screens/NewScreen';
import { palette } from './src/theme';

export default function App() {
  const c = palette(useColorScheme());
  const [tab, setTab] = useState('list');
  const [reminders, setReminders] = useState([]);
  const [perm, setPerm] = useState({ ok: true, reason: null });

  const persist = useCallback(async (next) => {
    setReminders(next);
    await saveReminders(next);
    await syncGeofences().catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      setReminders(await loadReminders());
      const p = await ensurePermissions();
      setPerm(p);
      if (p.ok) {
        await startMoveWatcher().catch(() => {});
        await syncGeofences().catch(() => {});
      }
    })();
  }, []);

  const add = async (r) => {
    const notifIds = await scheduleTimed(r);
    await persist([...reminders, { ...r, notifIds }]);
    setTab('list');
  };

  const toggle = async (id) => {
    const next = [];
    for (const r of reminders) {
      if (r.id !== id) { next.push(r); continue; }
      const done = !r.done;
      if (done) { await cancelIds(r.notifIds); next.push({ ...r, done, notifIds: [] }); }
      else { next.push({ ...r, done, notifIds: await scheduleTimed(r) }); }
    }
    await persist(next);
  };

  const remove = (id) => {
    Alert.alert('Delete reminder?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const r = reminders.find((x) => x.id === id);
          if (r) await cancelIds(r.notifIds);
          await persist(reminders.filter((x) => x.id !== id));
        },
      },
    ]);
  };

  const titles = { list: 'Remind Me', map: 'Nearby', new: 'New reminder' };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.bar} />
      <Text style={[s.title, { color: c.ink }]}>{titles[tab]}</Text>
      {!perm.ok && tab === 'list' && (
        <View style={[s.warn, { borderColor: c.sig, backgroundColor: c.card }]}>
          <Text style={{ color: c.ink }}>
            {perm.reason === 'notifications'
              ? 'Turn on notifications in Settings so Remind Me can alert you.'
              : "Set location access to 'Always' in Settings so alerts work when the app is closed."}
          </Text>
        </View>
      )}
      <View style={s.body}>
        {tab === 'list' && <ListScreen reminders={reminders} onToggle={toggle} onDelete={remove} c={c} />}
        {tab === 'map' && <MapScreen reminders={reminders} c={c} />}
        {tab === 'new' && <NewScreen onSave={add} c={c} />}
      </View>
      <View style={[s.nav, { backgroundColor: c.card, borderColor: c.line }]}>
        {['list', 'map', 'new'].map((t) => (
          <TouchableOpacity key={t} style={s.navBtn} onPress={() => setTab(t)} accessibilityRole="button">
            <Text style={{ color: tab === t ? c.acc : c.mut, fontWeight: tab === t ? '700' : '500' }}>
              {{ list: 'Reminders', map: 'Map', new: 'New' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 16 },
  warn: { marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  nav: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 6 },
  navBtn: { flex: 1, alignItems: 'center', padding: 14 },
});
