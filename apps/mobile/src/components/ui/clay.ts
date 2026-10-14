import type { ViewStyle } from 'react-native';

const CHARCOAL = '#252823';
const CREAM_EDGE = 'rgba(251, 246, 236, 0.9)';
const SHELF_EDGE = '#DDD4C7';
const PRIMARY_EDGE = '#B94E32';

/** Soft raised tile — login legal card / fields. */
export const clayCard: ViewStyle = {
  shadowColor: CHARCOAL,
  shadowOffset: { width: 2, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
  borderTopWidth: 2,
  borderTopColor: CREAM_EDGE,
  borderBottomWidth: 4,
  borderBottomColor: SHELF_EDGE,
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
};

/** Pressed-clay CTA — login primary / forest secondary. */
export function clayButton(variant: 'primary' | 'forest'): ViewStyle {
  return {
    shadowColor: CHARCOAL,
    shadowOffset: { width: 4, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(243, 232, 207, 0.7)',
    borderBottomWidth: 6,
    borderBottomColor: variant === 'primary' ? PRIMARY_EDGE : CHARCOAL,
  };
}

/** Login overlapping cream sheet — hero lip + overlays. */
export const claySheet: ViewStyle = {
  backgroundColor: '#FBF6EC',
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  borderTopWidth: 2,
  borderTopColor: CREAM_EDGE,
  shadowColor: CHARCOAL,
  shadowOffset: { width: 0, height: -8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

/** Compact clay pill — chips, badges, day cells. */
export function clayChip(selected = false): ViewStyle {
  return {
    shadowColor: CHARCOAL,
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: selected ? 0.2 : 0.12,
    shadowRadius: 4,
    elevation: selected ? 3 : 2,
    borderTopWidth: 2,
    borderTopColor: CREAM_EDGE,
    borderBottomWidth: 3,
    borderBottomColor: selected ? PRIMARY_EDGE : SHELF_EDGE,
  };
}
