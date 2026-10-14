import type { Shift } from '@parton/api-contracts';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  clearActiveShift,
  setActiveShift,
} from '../../shared/shifts/active-shift-store';
import { ActiveShiftCapsule } from './ActiveShiftCapsule';

function createMockShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-abc',
    jobId: 'job-1',
    branchId: 'branch-1',
    jobTitle: 'Barista',
    branchName: 'Moda Kafe',
    startsAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    payAmount: 1400,
    currency: 'TRY',
    status: 'checked_in',
    checkInWindowMinutes: 30,
    checkInMethod: 'qr_and_geofence',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Shift;
}

describe('ActiveShiftCapsule', () => {
  let currentRenderer: ReactTestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    ReactTestRenderer.act(() => {
      clearActiveShift();
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      currentRenderer?.unmount();
    });
    currentRenderer = undefined;
    jest.useRealTimers();
  });

  it('renders nothing when no active shift is set in the store', () => {
    ReactTestRenderer.act(() => {
      currentRenderer = ReactTestRenderer.create(
        <ActiveShiftCapsule onPress={jest.fn()} />,
      );
    });

    expect(currentRenderer?.toJSON()).toBeNull();
  });

  it('renders in-progress status label and triggers onPress when clicked', () => {
    const shift = createMockShift({ status: 'checked_in' });
    ReactTestRenderer.act(() => {
      setActiveShift(shift);
    });

    const onPressMock = jest.fn();

    ReactTestRenderer.act(() => {
      currentRenderer = ReactTestRenderer.create(
        <ActiveShiftCapsule onPress={onPressMock} />,
      );
    });

    const root = currentRenderer!.root;
    const capsuleView = root.findByProps({ testID: 'c.activeShiftCapsule' });
    expect(capsuleView).toBeTruthy();

    const mainPressable = root.findByProps({
      accessibilityLabel: 'Vardiyadasınız: Barista',
    });
    ReactTestRenderer.act(() => {
      mainPressable.props.onPress();
    });

    expect(onPressMock).toHaveBeenCalledWith(shift);
  });

  it('renders 3h confirmation status when awaiting_confirm', () => {
    const shift = createMockShift({
      status: 'awaiting_confirm',
      confirmWindow: {
        isOpen: true,
        opensAt: '2026-10-14T11:00:00.000Z',
        deadlineAt: '2026-10-14T14:00:00.000Z',
      },
    });
    ReactTestRenderer.act(() => {
      setActiveShift(shift);
    });

    ReactTestRenderer.act(() => {
      currentRenderer = ReactTestRenderer.create(
        <ActiveShiftCapsule onPress={jest.fn()} />,
      );
    });

    const root = currentRenderer!.root;
    const confirmLabel = root.findByProps({
      accessibilityLabel: '3 Saat Onayı Bekliyor: Barista',
    });
    expect(confirmLabel).toBeTruthy();
  });
});
