import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NativeTimeRangePicker } from './NativeTimeRangePicker';

describe('NativeTimeRangePicker', () => {
  it('computes daytime duration and handles preset clicks', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeTimeRangePicker
          startTime="09:00"
          endTime="17:00"
          onChange={onChange}
        />,
      );
    });

    const root = renderer!.root;
    // Click 6 saat preset
    const preset6 = root.findByProps({ testID: 'range.preset.6' });
    expect(preset6).toBeTruthy();

    ReactTestRenderer.act(() => {
      preset6.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '09:00',
        endTime: '15:00',
        crossesMidnight: false,
        durationMinutes: 360,
        durationFormatted: '6 saat',
      }),
    );
  });

  it('detects overnight shift and allows toggle', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeTimeRangePicker
          startTime="22:00"
          endTime="06:00"
          onChange={onChange}
        />,
      );
    });

    const root = renderer!.root;
    const overnightSwitch = root.findByProps({ testID: 'range.overnightSwitch' });
    expect(overnightSwitch).toBeTruthy();

    ReactTestRenderer.act(() => {
      overnightSwitch.props.onPress();
    });

    // Toggle flips overnight from true to false
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '22:00',
        endTime: '06:00',
        crossesMidnight: false,
      }),
    );
  });
});
