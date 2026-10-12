import React, { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { REPEAT_LABELS } from '../constants';

const RADII = [150, 300, 450, 600];

function Chip({ label, on, onPress, c }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, { borderColor: c.acc, backgroundColor: on ? c.acc : 'transparent' }]}
    >
      <Text style={{ color: on ? c.on : c.ink, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function NewScreen({ onSave, c }) {
  const mapRef = useRef(null);
  const [type, setType] = useState('near');
  const [title, setTitle] = useState('');
  const [places, setPlaces] = useState([]);
  const [draft, setDraft] = useState(null); // tapped or searched point, not yet added
  const [placeName, setPlaceName] = useState('');
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState(300);
  const [where, setWhere] = useState('');
  const [home, setHome] = useState(null);
  const [when, setWhen] = useState(null);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [repeat, setRepeat] = useState('none');
  const [error, setError] = useState('');

  const input = [s.input, { backgroundColor: c.card, borderColor: c.line, color: c.ink }];

  const search = async () => {
    if (!query.trim()) return;
    try {
      const hits = await Location.geocodeAsync(query.trim());
      if (!hits.length) return setError('No match for that address. Try adding a city, or tap the map.');
      const p = { latitude: hits[0].latitude, longitude: hits[0].longitude };
      setDraft(p);
      setError('');
      mapRef.current?.animateToRegion({ ...p, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      setError('Address search failed. Tap the map to pin the place instead.');
    }
  };

  const addPlace = () => {
    if (!draft) return setError('Search an address or tap the map first.');
    setPlaces([...places, { name: placeName.trim() || query.trim() || `Stop ${places.length + 1}`, lat: draft.latitude, lng: draft.longitude }]);
    setDraft(null); setPlaceName(''); setQuery(''); setError('');
  };

  const useHere = async () => {
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setHome({ lat: p.coords.latitude, lng: p.coords.longitude });
      setError('');
    } catch {
      setError("Couldn't get your location. Check that location is on.");
    }
  };

  const pickWhen = () => {
    if (Platform.OS === 'ios') return setShowIosPicker(!showIosPicker);
    const base = when || new Date();
    DateTimePickerAndroid.open({
      value: base, mode: 'date',
      onChange: (e, d) => {
        if (e.type !== 'set') return;
        DateTimePickerAndroid.open({ value: d, mode: 'time', onChange: (e2, t) => e2.type === 'set' && setWhen(t) });
      },
    });
  };

  const save = () => {
    if (!title.trim()) return setError('Add a name for this reminder.');
    if (type === 'near' && !places.length) return setError('Add at least one place.');
    if (type === 'leave' && !home) return setError("Stand at home and tap 'Use my current location as home'.");
    const base = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title.trim(), type,
      when: when ? when.toISOString() : null, repeat: when ? repeat : 'none',
      done: false, lastFired: null, notifIds: [],
    };
    onSave(type === 'near' ? { ...base, places, radius } : { ...base, where: where.trim(), home, places: [] });
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={s.row}>
        <Chip label="At a place" on={type === 'near'} onPress={() => setType('near')} c={c} />
        <Chip label="Left behind" on={type === 'leave'} onPress={() => setType('leave')} c={c} />
      </View>

      <Text style={[s.label, { color: c.ink }]}>{type === 'near' ? 'What do you need to remember?' : "What shouldn't you forget?"}</Text>
      <TextInput style={input} value={title} onChangeText={setTitle} placeholder={type === 'near' ? 'Buy milk and eggs' : 'Lunch'} placeholderTextColor={c.mut} />

      {type === 'near' ? (
        <>
          <Text style={[s.label, { color: c.ink }]}>Find the store</Text>
          <View style={s.row}>
            <TextInput style={[...input, { flex: 1 }]} value={query} onChangeText={setQuery} placeholder="Address or store name" placeholderTextColor={c.mut} onSubmitEditing={search} returnKeyType="search" />
            <Chip label="Search" onPress={search} c={c} />
          </View>
          <MapView ref={mapRef} style={s.map} showsUserLocation onPress={(e) => setDraft(e.nativeEvent.coordinate)}>
            {places.map((p, i) => (
              <React.Fragment key={i}>
                <Marker coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.name} />
                <Circle center={{ latitude: p.lat, longitude: p.lng }} radius={radius} strokeColor={c.sig} fillColor={c.sig + '30'} />
              </React.Fragment>
            ))}
            {draft && <Marker coordinate={draft} pinColor={c.acc} />}
          </MapView>
          <Text style={{ color: c.mut, marginTop: 6 }}>Search, or tap the map to drop a pin.</Text>
          <View style={[s.row, { marginTop: 10 }]}>
            <TextInput style={[...input, { flex: 1 }]} value={placeName} onChangeText={setPlaceName} placeholder="Name this place (optional)" placeholderTextColor={c.mut} />
            <Chip label="Add place" onPress={addPlace} c={c} />
          </View>
          <View style={s.wrap}>
            {places.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => setPlaces(places.filter((_, j) => j !== i))} style={[s.tag, { borderColor: c.sig, backgroundColor: c.card }]}>
                <Text style={{ color: c.ink }}>{p.name}  ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.label, { color: c.ink }]}>Alert me within {radius} m</Text>
          <View style={s.row}>{RADII.map((r) => <Chip key={r} label={`${r} m`} on={radius === r} onPress={() => setRadius(r)} c={c} />)}</View>
        </>
      ) : (
        <>
          <Text style={[s.label, { color: c.ink }]}>Where is it?</Text>
          <TextInput style={input} value={where} onChangeText={setWhere} placeholder="Kitchen counter" placeholderTextColor={c.mut} />
          <Text style={{ color: c.mut, marginTop: 8 }}>You'll be alerted as you leave home, with "Did you get your {title.trim().toLowerCase() || 'item'}?"</Text>
          <TouchableOpacity onPress={useHere} style={[s.btn, { backgroundColor: home ? c.card : c.acc, borderColor: c.acc, borderWidth: 1 }]}>
            <Text style={{ color: home ? c.ink : c.on, fontWeight: '700' }}>{home ? 'Home set ✓ (tap to update)' : 'Use my current location as home'}</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={[s.label, { color: c.ink }]}>Date and time (optional)</Text>
      <View style={s.row}>
        <Chip label={when ? when.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Set date and time'} on={!!when} onPress={pickWhen} c={c} />
        {!!when && <Chip label="Clear" onPress={() => { setWhen(null); setRepeat('none'); setShowIosPicker(false); }} c={c} />}
      </View>
      {Platform.OS === 'ios' && showIosPicker && (
        <DateTimePicker value={when || new Date()} mode="datetime" display="inline" onChange={(_, d) => d && setWhen(d)} />
      )}
      {!!when && (
        <>
          <Text style={[s.label, { color: c.ink }]}>Repeat</Text>
          <View style={s.wrap}>{Object.entries(REPEAT_LABELS).map(([k, v]) => <Chip key={k} label={v} on={repeat === k} onPress={() => setRepeat(k)} c={c} />)}</View>
        </>
      )}

      {!!error && <Text style={{ color: '#C0392B', marginTop: 12 }}>{error}</Text>}
      <TouchableOpacity onPress={save} style={[s.btn, { backgroundColor: c.acc }]}>
        <Text style={{ color: c.on, fontWeight: '700', fontSize: 16 }}>Save reminder</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  label: { fontWeight: '600', fontSize: 15, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14 },
  tag: { borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  map: { height: 260, borderRadius: 14, marginTop: 10 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 18 },
});
