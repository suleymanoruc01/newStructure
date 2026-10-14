import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NativeTimePicker } from './NativeTimePicker';

describe('NativeTimePicker', () => {
  it('renders inline time picker and selects hour and minute', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeTimePicker
          label="Başlangıç Saati"
          value="09:00"
          onChange={onChange}
          presentation="inline"
        />,
      );
    });

    const root = renderer!.root;
    // Hour tab is active by default; find hour 14 button
    const hour14 = root.findByProps({ testID: 'time-picker.hour.14' });
    expect(hour14).toBeTruthy();

    ReactTestRenderer.act(() => {
      hour14.props.onPress();
    });

    // Should have changed hour to 14:00 and automatically switched to minute tab
    expect(onChange).toHaveBeenCalledWith('14:00');

    // Find minute 30 button
    const min30 = root.findByProps({ testID: 'time-picker.minute.30' });
    expect(min30).toBeTruthy();

    ReactTestRenderer.act(() => {
      min30.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith('09:30');
  });

  it('renders sheet trigger and confirms time', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeTimePicker
          label="Mesai Saati"
          value="08:15"
          onChange={onChange}
          presentation="sheet"
          testID="shift-time"
        />,
      );
    });

    const root = renderer!.root;
    const trigger = root.findByProps({ testID: 'shift-time.trigger' });
    expect(trigger).toBeTruthy();

    ReactTestRenderer.act(() => {
      trigger.props.onPress();
    });

    const confirmBtn = root.findByProps({ testID: 'shift-time.confirm' });
    expect(confirmBtn).toBeTruthy();

    ReactTestRenderer.act(() => {
      confirmBtn.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith('08:15');
  });
});
