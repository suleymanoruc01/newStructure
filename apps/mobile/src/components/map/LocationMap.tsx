import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiClientError } from '../../api/client';
import { Button } from '../ui/Button';
import { clayCard } from '../ui/clay';
import { readDeviceCoordinates } from '../../shared/location/device-coordinates';
import {
  ISTANBUL_PIN,
  mapRegion,
} from '../../shared/location/geofence';
import type { PermissionMoment } from '../../shared/privacy/permission-moment';

const FOREST = '#344A32';
const ORANGE = '#E97A3D';

type Pin = { latitude: number; longitude: number };

type Props = {
  pin?: Pin | null;
  pinLabel?: string;
  user?: Pin | null;
  radiusM?: number;
  softRadiusM?: number;
  onPick?: (pin: Pin) => void;
  locateMoment?: PermissionMoment;
  testID?: string;
};

export function LocationMap({
  pin,
  pinLabel,
  user,
  radiusM,
  softRadiusM,
  onPick,
  locateMoment,
  testID,
}: Props) {
  const { t } = useTranslation(['common', 'errors']);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [camera, setCamera] = useState<Pin | null>(null);
  const center = pin ?? user ?? camera ?? ISTANBUL_PIN;
  const region = mapRegion(center.latitude, center.longitude, softRadiusM);
  const mapKey = `${center.latitude.toFixed(5)}-${center.longitude.toFixed(5)}`;

  const locate = async () => {
    if (!locateMoment) {
      return;
    }
    setLocating(true);
    setLocateError(null);
    try {
      const device = await readDeviceCoordinates(locateMoment);
      const next = { latitude: device.latitude, longitude: device.longitude };
      setCamera(next);
      if (onPick) {
        onPick(next);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLocateError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setLocateError(t('common:networkError'));
      }
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!expanded || pin || user || !locateMoment) {
      return;
    }
    let cancelled = false;
    void readDeviceCoordinates(locateMoment)
      .then((device) => {
        if (!cancelled) {
          setCamera({
            latitude: device.latitude,
            longitude: device.longitude,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [expanded, locateMoment, pin, user]);

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
      moveOnMarkerPress={false}
      onPress={
        onPick
          ? (event) => {
              const coordinate = event.nativeEvent.coordinate;
              onPick({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
              });
            }
          : undefined
      }
    >
      {softRadiusM && pin ? (
        <Circle
          center={pin}
          radius={softRadiusM}
          strokeColor="rgba(233, 122, 61, 0.7)"
          fillColor="rgba(233, 122, 61, 0.08)"
          strokeWidth={1}
        />
      ) : null}
      {radiusM && pin ? (
        <Circle
          center={pin}
          radius={radiusM}
          strokeColor={FOREST}
          fillColor="rgba(52, 74, 50, 0.18)"
          strokeWidth={2}
        />
      ) : null}
      {pin ? (
        <Marker coordinate={pin} title={pinLabel} pinColor={FOREST} />
      ) : null}
      {user ? (
        <Marker coordinate={user} pinColor={ORANGE} title="GPS" />
      ) : null}
    </MapView>
  );

  return (
    <View>
      <View style={[clayCard, styles.frame]} testID={testID ?? 'LocationMap'}>
        {map('frame')}
      </View>
      {onPick ? (
        <Text className="font-sans mt-2 text-sm text-text-medium">
          {t('common:map.tapToPin')}
        </Text>
      ) : null}
      <View className="mt-3 gap-3">
        <Button
          label={t('common:map.expand')}
          variant="secondary"
          onPress={() => setExpanded(true)}
        />
        {locateMoment && onPick ? (
          <Button
            label={locating ? t('common:loading') : t('common:map.useMyLocation')}
            variant="secondary"
            disabled={locating}
            onPress={() => void locate()}
          />
        ) : null}
      </View>
      {locateError ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{locateError}</Text>
      ) : null}
      <Modal
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
        visible={expanded}
      >
        <SafeAreaView className="flex-1 bg-surface-base" edges={['top', 'left', 'right']}>
          <View className="flex-1">{map('full')}</View>
          <View className="gap-3 px-4 py-4">
            {locateMoment && onPick ? (
              <Button
                label={
                  locating ? t('common:loading') : t('common:map.useMyLocation')
                }
                disabled={locating}
                onPress={() => void locate()}
              />
            ) : null}
            <Button
              label={t('common:back')}
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
    height: 220,
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
