import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LEAVE_RADIUS_M } from '../constants';

export default function MapScreen({ reminders, c }) {
  const [here, setHere] = useState(null);
  useEffect(() => {
    Location.getCurrentPositionAsync({}).then((p) => setHere(p.coords)).catch(() => {});
  }, []);

  const active = reminders.filter((r) => !r.done);
  const region = here
    ? { latitude: here.latitude, longitude: here.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : undefined;

  return (
    <>
      <MapView style={s.map} showsUserLocation region={region} initialRegion={region}>
        {active.flatMap((r) =>
          r.type === 'near'
            ? r.places.map((p, i) => (
                <React.Fragment key={`${r.id}-${i}`}>
                  <Marker coordinate={{ latitude: p.lat, longitude: p.lng }} title={r.title} description={p.name} pinColor={c.sig} />
                  <Circle center={{ latitude: p.lat, longitude: p.lng }} radius={r.radius} strokeColor={c.sig} fillColor={c.sig + '30'} />
                </React.Fragment>
              ))
            : r.home
            ? [
                <React.Fragment key={r.id}>
                  <Marker coordinate={{ latitude: r.home.lat, longitude: r.home.lng }} title={r.title} description="Alerts when you leave" />
                  <Circle center={{ latitude: r.home.lat, longitude: r.home.lng }} radius={LEAVE_RADIUS_M} strokeColor={c.acc} fillColor={c.acc + '30'} />
                </React.Fragment>,
              ]
            : []
        )}
      </MapView>
      <Text style={[s.hint, { color: c.mut }]}>Rings show where each alert will fire.</Text>
    </>
  );
}

const s = StyleSheet.create({
  map: { flex: 1, borderRadius: 14 },
  hint: { fontSize: 13, paddingVertical: 10 },
});
