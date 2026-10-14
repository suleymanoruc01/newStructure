import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NativeDatePicker } from './NativeDatePicker';
import { NativeCalendar } from './NativeCalendar';

describe('NativeDatePicker', () => {
  it('renders inline date picker and changes date', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeDatePicker
          label="Başlangıç Tarihi"
          value="2026-10-14"
          onChange={onChange}
          presentation="inline"
        />,
      );
    });

    const root = renderer!.root;
    const calendar = root.findByType(NativeCalendar);
    expect(calendar).toBeTruthy();

    ReactTestRenderer.act(() => {
      calendar.props.onSelectDate('2026-10-20');
    });

    expect(onChange).toHaveBeenCalledWith('2026-10-20');
  });

  it('renders sheet trigger and opens modal on tap', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeDatePicker
          label="İş Tarihi"
          value="2026-10-14"
          onChange={onChange}
          presentation="sheet"
          testID="job-date"
        />,
      );
    });

    const root = renderer!.root;
    const trigger = root.findByProps({ testID: 'job-date.trigger' });
    expect(trigger).toBeTruthy();

    ReactTestRenderer.act(() => {
      trigger.props.onPress();
    });

    // Confirm button should be visible in modal
    const confirmBtn = root.findByProps({ testID: 'job-date.confirm' });
    expect(confirmBtn).toBeTruthy();

    ReactTestRenderer.act(() => {
      confirmBtn.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith('2026-10-14');
  });
});
