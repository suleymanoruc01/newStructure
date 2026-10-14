import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { triggerHaptic } from '../../shared/ui/haptics';
import { Pressable } from '../ui/Pressable';

const FOREST = '#344A32';
const CREAM = '#F3E8CF';
const SHELF = '#FBF6EC';
const CHARCOAL = '#252823';
const EMERALD = '#22C55E';
const MUTED = '#6B7A66';

export type BentoTelemetryData = {
  averageHourlyRateTry: number;
  rateTrendPercent?: number;
  reliabilityScorePercent: number;
  weeklyHoursCompleted: number;
  weeklyHoursTarget: number;
  distanceToNextVenueM?: number | null;
  venueName?: string | null;
};

type Props = {
  data: BentoTelemetryData;
  onTilePress?: (metric: 'velocity' | 'reliability' | 'hours' | 'proximity') => void;
};

export function WorkerBentoTelemetry({ data, onTilePress }: Props) {
  const {
    averageHourlyRateTry,
    rateTrendPercent = 8,
    reliabilityScorePercent,
    weeklyHoursCompleted,
    weeklyHoursTarget,
    distanceToNextVenueM,
    venueName,
  } = data;

  const hoursProgress = Math.min(
    1,
    Math.max(0, weeklyHoursTarget > 0 ? weeklyHoursCompleted / weeklyHoursTarget : 0),
  );

  const proximityLabel =
    distanceToNextVenueM != null
      ? distanceToNextVenueM < 1000
        ? `${Math.round(distanceToNextVenueM)} m`
        : `${(distanceToNextVenueM / 1000).toFixed(1)} km`
      : 'Vardiya Yok';

  const handlePress = (metric: 'velocity' | 'reliability' | 'hours' | 'proximity') => {
    triggerHaptic('light');
    onTilePress?.(metric);
  };

  return (
    <View style={styles.container} testID="c.workerBentoTelemetry">
      {/* Top Row: Earning Velocity & Reliability Score */}
      <View style={styles.row}>
        {/* Tile 1: Earning Velocity */}
        <Pressable
          accessibilityLabel={`Kazanım Hızı: saatte ${averageHourlyRateTry} TL`}
          accessibilityRole="button"
          onPress={() => handlePress('velocity')}
          style={[styles.tile, styles.halfTile]}
        >
          <View style={styles.tileHeader}>
            <Text style={styles.tileEyebrow}>KAZANIM HIZI</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>+{rateTrendPercent}%</Text>
            </View>
          </View>
          <Text style={styles.largeValue}>
            ₺{averageHourlyRateTry}
            <Text style={styles.unitText}> /sa</Text>
          </Text>
          <Text style={styles.subText}>Ortalama Net Saatlik</Text>
        </Pressable>

        {/* Tile 2: Reliability Index */}
        <Pressable
          accessibilityLabel={`Güvenilirlik Endeksi: yüzde ${reliabilityScorePercent}`}
          accessibilityRole="button"
          onPress={() => handlePress('reliability')}
          style={[styles.tile, styles.halfTile]}
        >
          <View style={styles.tileHeader}>
            <Text style={styles.tileEyebrow}>GÜVENİLİRLİK</Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <View style={styles.shieldDot} />
            <Text style={styles.largeValue}>%{reliabilityScorePercent}</Text>
          </View>
          <Text style={styles.subText}>Yüksek Öncelikli Eşleşme</Text>
        </Pressable>
      </View>

      {/* Bottom Row: Weekly Target Progress & Proximity */}
      <View style={styles.row}>
        {/* Tile 3: Weekly Hours Target */}
        <Pressable
          accessibilityLabel={`Haftalık Hedef: ${weeklyHoursCompleted} bölü ${weeklyHoursTarget} saat`}
          accessibilityRole="button"
          onPress={() => handlePress('hours')}
          style={[styles.tile, styles.halfTile]}
        >
          <Text style={styles.tileEyebrow}>HAFTALIK HEDEF</Text>
          <Text style={styles.mediumValue}>
            {weeklyHoursCompleted}
            <Text style={styles.targetUnit}> / {weeklyHoursTarget} sa</Text>
          </Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(hoursProgress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.subText}>Kapasite %{Math.round(hoursProgress * 100)}</Text>
        </Pressable>

        {/* Tile 4: Shift Proximity Radar */}
        <Pressable
          accessibilityLabel={`Konum Mesafesi: ${proximityLabel}`}
          accessibilityRole="button"
          onPress={() => handlePress('proximity')}
          style={[styles.tile, styles.halfTile]}
        >
          <Text style={styles.tileEyebrow}>ŞUBE MESAFESİ</Text>
          <Text style={styles.mediumValue}>{proximityLabel}</Text>
          <Text numberOfLines={1} style={styles.subText}>
            {venueName ? `📍 ${venueName}` : 'Bekleyen Konum'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    backgroundColor: SHELF,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CREAM,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: CHARCOAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  halfTile: {
    flex: 1,
    minHeight: 105,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tileEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.5,
  },
  trendBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: FOREST,
  },
  vipBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  vipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EMERALD,
  },
  largeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: CHARCOAL,
    letterSpacing: -0.5,
  },
  mediumValue: {
    fontSize: 18,
    fontWeight: '800',
    color: CHARCOAL,
    marginTop: 2,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  targetUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
  },
  subText: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: CREAM,
    width: '100%',
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: FOREST,
  },
});
