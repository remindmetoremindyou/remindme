import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { REPEAT_LABELS } from '../constants';

function whenText(r) {
  if (!r.when) return '';
  const d = new Date(r.when);
  const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const day = r.repeat === 'none' ? d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' : '';
  const rep = r.repeat !== 'none' ? ' · ' + REPEAT_LABELS[r.repeat] : '';
  return day + t + rep;
}

export default function ListScreen({ reminders, onToggle, onDelete, c }) {
  const sorted = [...reminders].sort((a, b) => Number(a.done) - Number(b.done));
  if (!sorted.length) {
    return <Text style={[s.empty, { color: c.mut }]}>No reminders yet. Tap New to add your first one.</Text>;
  }
  return (
    <FlatList
      data={sorted}
      keyExtractor={(r) => r.id}
      renderItem={({ item: r }) => {
        const where = r.type === 'leave'
          ? `${r.where || 'Home'} · alerts when you leave home`
          : `${r.places.map((p) => p.name).join(' or ')} · within ${r.radius} m`;
        const w = whenText(r);
        return (
          <TouchableOpacity
            onLongPress={() => onDelete(r.id)}
            activeOpacity={0.8}
            style={[s.card, { backgroundColor: c.card, borderColor: c.line, opacity: r.done ? 0.5 : 1 }]}
          >
            <TouchableOpacity
              onPress={() => onToggle(r.id)}
              accessibilityLabel="Toggle done"
              style={[s.chk, { borderColor: c.acc, backgroundColor: r.done ? c.acc : 'transparent' }]}
            >
              {r.done && <Text style={{ color: c.on }}>✓</Text>}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.t, { color: c.ink, textDecorationLine: r.done ? 'line-through' : 'none' }]}>{r.title}</Text>
              <Text style={{ color: c.mut, marginTop: 2 }}>{where}</Text>
              {!!w && <Text style={{ color: c.mut, marginTop: 2 }}>{w}</Text>}
            </View>
          </TouchableOpacity>
        );
      }}
      ListFooterComponent={<Text style={[s.hint, { color: c.mut }]}>Press and hold a reminder to delete it.</Text>}
    />
  );
}

const s = StyleSheet.create({
  empty: { textAlign: 'center', padding: 36 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  chk: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  t: { fontSize: 17, fontWeight: '600' },
  hint: { textAlign: 'center', fontSize: 13, paddingVertical: 12 },
});
