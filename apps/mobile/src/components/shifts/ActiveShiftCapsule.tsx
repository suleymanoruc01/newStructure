import type { Shift } from '@parton/api-contracts';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import {
  elapsedLabel,
  remainingLabel,
} from '../../shared/datetime/countdown';
import {
  dismissActiveShift,
  useActiveShift,
} from '../../shared/shifts/active-shift-store';
import { triggerHaptic } from '../../shared/ui/haptics';
import { Pressable } from '../ui/Pressable';

const FOREST = '#344A32';
const CREAM = '#F3E8CF';
const SHELF = '#FBF6EC';
const CHARCOAL = '#252823';
const MUSTARD = '#E2B83F';
const EMERALD = '#22C55E';
const AMBER = '#F59E0B';

type Props = {
  onPress: (shift: Shift) => void;
};

export function ActiveShiftCapsule({ onPress }: Props) {
  const shift = useActiveShift();
  const [, setTick] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update timer label every 30 seconds
  useEffect(() => {
    if (!shift) {
      return;
    }
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, [shift]);

  const isInProgress =
    shift?.status === 'checked_in' || shift?.status === 'manual_confirmed';
  const isAwaitingConfirm =
    shift?.confirmWindow?.isOpen || shift?.status === 'awaiting_confirm';

  useEffect(() => {
    if (!isInProgress && !isAwaitingConfirm) {
      pulseAnim.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isInProgress, isAwaitingConfirm, pulseAnim]);

  if (!shift) {
    return null;
  }

  const beaconColor = isInProgress
    ? EMERALD
    : isAwaitingConfirm
      ? AMBER
      : MUSTARD;

  const statusLabel = isInProgress
    ? 'Vardiyadasınız'
    : isAwaitingConfirm
      ? '3 Saat Onayı Bekliyor'
      : 'Sıradaki Vardiya';

  const timeBadge = isInProgress
    ? `${elapsedLabel(shift.startsAt) ?? '0 dk'} çalışılıyor`
    : `${remainingLabel(shift.startsAt) ?? '0 dk'} kaldı`;

  const ctaLabel = isInProgress
    ? 'Vardiyaya Git'
    : isAwaitingConfirm
      ? 'Katılımı Onayla'
      : 'Check-In Yap';

  const title = shift.jobTitle ?? shift.branchName ?? 'Vardiya';
  const subtitle = shift.branchName ? `📍 ${shift.branchName}` : null;

  const handlePress = () => {
    triggerHaptic('medium');
    onPress(shift);
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissActiveShift(shift.id);
  };

  return (
    <View style={styles.outerContainer} testID="c.activeShiftCapsule">
      <Pressable
        accessibilityHint="Vardiya detaylarına gitmek için dokunun"
        accessibilityLabel={`${statusLabel}: ${title}`}
        accessibilityRole="button"
        onPress={handlePress}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <Animated.View
              style={[
                styles.beaconDot,
                { backgroundColor: beaconColor, opacity: pulseAnim },
              ]}
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>

          <View style={styles.topRightRow}>
            <View style={styles.timePill}>
              <Text style={styles.timeText}>{timeBadge}</Text>
            </View>
            <Pressable
              accessibilityLabel="Kapat"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleDismiss}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.titleColumn}>
            <Text numberOfLines={1} style={styles.titleText}>
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={styles.subtitleText}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionButton}>
            <Text style={styles.actionText}>{ctaLabel}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
    width: '100%',
  },
  card: {
    backgroundColor: SHELF,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CREAM,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: CHARCOAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  beaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: FOREST,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePill: {
    backgroundColor: CREAM,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: CHARCOAL,
  },
  closeButton: {
    padding: 2,
  },
  closeText: {
    fontSize: 12,
    color: '#83947A',
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: CHARCOAL,
  },
  subtitleText: {
    fontSize: 12,
    color: '#555E50',
    marginTop: 1,
  },
  actionButton: {
    backgroundColor: FOREST,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: CREAM,
  },
});
