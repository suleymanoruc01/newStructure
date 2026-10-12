import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../ui/Button';
import { clayCard } from '../ui/clay';
import { ISTANBUL_PIN, mapRegion } from '../../shared/location/geofence';

const FOREST = '#344A32';
const ORANGE = '#E97A3D';

export type JobMapPin = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

function regionForPins(pins: JobMapPin[]) {
  if (pins.length === 0) {
    return mapRegion(ISTANBUL_PIN.latitude, ISTANBUL_PIN.longitude);
  }
  if (pins.length === 1) {
    const pin = pins[0]!;
    return mapRegion(pin.latitude, pin.longitude);
  }
  const lats = pins.map((pin) => pin.latitude);
  const lngs = pins.map((pin) => pin.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.02),
  };
}

export function JobsMap({
  pins,
  selectedId,
  onSelect,
}: {
  pins: JobMapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);
  const region = useMemo(() => regionForPins(pins), [pins]);
  const mapKey = `${region.latitude.toFixed(4)}-${region.longitude.toFixed(4)}-${pins.length}`;

  const map = (fill: 'frame' | 'full') => (
    <MapView
      key={mapKey}
      style={fill === 'full' ? styles.mapFill : styles.map}
      initialRegion={region}
      scrollEnabled
      zoomEnabled
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
    >
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
          title={pin.title}
          pinColor={pin.id === selectedId ? ORANGE : FOREST}
          onPress={() => onSelect(pin.id)}
        />
      ))}
    </MapView>
  );

  return (
    <View>
      <View style={[clayCard, styles.frame]} testID="JobsMap">
        {map('frame')}
      </View>
      <View className="mt-3">
        <Button
          label={t('map.expand')}
          variant="secondary"
          onPress={() => setExpanded(true)}
        />
      </View>
      <Modal
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
        visible={expanded}
      >
        <SafeAreaView className="flex-1 bg-surface-base" edges={['top', 'left', 'right']}>
          <View className="flex-1">{map('full')}</View>
          <View className="px-4 py-4">
            <Button
              label={t('back')}
              variant="secondary"
              onPress={() => setExpanded(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 260,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FBF6EC',
  },
  map: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  mapFill: {
    flex: 1,
  },
});
