import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ActivityIndicator, Vibration } from 'react-native';

import { Button } from './Button';
import { Pressable } from './Pressable';

describe('Button', () => {
  let vibrateSpy: jest.SpyInstance;

  beforeEach(() => {
    vibrateSpy = jest.spyOn(Vibration, 'vibrate').mockImplementation();
  });

  afterEach(() => {
    vibrateSpy.mockRestore();
  });

  it('renders label and handles onPress with tactile vibration', () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Button label="Kaydet" onPress={onPress} testID="btn.save" />,
      );
    });

    const root = renderer!.root;
    const pressable = root.findByType(Pressable);
    expect(pressable).toBeTruthy();

    ReactTestRenderer.act(() => {
      pressable.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(vibrateSpy).toHaveBeenCalled();
  });

  it('renders ActivityIndicator when loading and disables press', () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Button label="Yükleniyor" onPress={onPress} loading testID="btn.loading" />,
      );
    });

    const root = renderer!.root;
    const spinner = root.findByType(ActivityIndicator);
    expect(spinner).toBeTruthy();

    const pressable = root.findByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.onPress).toBeUndefined();
    expect(onPress).not.toHaveBeenCalled();
  });
});
