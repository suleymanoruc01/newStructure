import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NativeCalendar } from './NativeCalendar';
import { Pressable } from './Pressable';

describe('NativeCalendar', () => {
  it('renders days and handles single date selection', () => {
    const onSelectDate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeCalendar
          mode="single"
          selectedDate="2026-10-14"
          monthKey="2026-10-01"
          onSelectDate={onSelectDate}
          testID="test.calendar"
        />,
      );
    });

    const root = renderer!.root;
    // Find day button for 2026-10-15
    const dayBtn = root.findByProps({ testID: 'calendar.day.2026-10-15' });
    expect(dayBtn).toBeTruthy();

    ReactTestRenderer.act(() => {
      dayBtn.props.onPress();
    });

    expect(onSelectDate).toHaveBeenCalledWith('2026-10-15');
  });

  it('handles month navigation', () => {
    const onMonthChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeCalendar
          monthKey="2026-10-01"
          onMonthChange={onMonthChange}
        />,
      );
    });

    const root = renderer!.root;
    const nextBtn = root.findByProps({ testID: 'calendar.nextMonth' });
    expect(nextBtn).toBeTruthy();

    ReactTestRenderer.act(() => {
      nextBtn.props.onPress();
    });

    expect(onMonthChange).toHaveBeenCalledWith('2026-11');
  });

  it('handles range selection flow', () => {
    const onSelectRange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeCalendar
          mode="range"
          selectedRange={{ start: '2026-10-10', end: '' }}
          monthKey="2026-10-01"
          onSelectRange={onSelectRange}
        />,
      );
    });

    const root = renderer!.root;
    const endDayBtn = root.findByProps({ testID: 'calendar.day.2026-10-18' });

    ReactTestRenderer.act(() => {
      endDayBtn.props.onPress();
    });

    expect(onSelectRange).toHaveBeenCalledWith({
      start: '2026-10-10',
      end: '2026-10-18',
    });
  });

  it('disables dates outside minDate and maxDate', () => {
    const onSelectDate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NativeCalendar
          minDate="2026-10-10"
          maxDate="2026-10-20"
          monthKey="2026-10-01"
          onSelectDate={onSelectDate}
        />,
      );
    });

    const root = renderer!.root;
    const disabledDayBtn = root.findByProps({ testID: 'calendar.day.2026-10-05' });
    expect(disabledDayBtn.props.disabled).toBe(true);

    ReactTestRenderer.act(() => {
      disabledDayBtn.props.onPress();
    });

    expect(onSelectDate).not.toHaveBeenCalled();
  });
});
