import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  WorkerBentoTelemetry,
  type BentoTelemetryData,
} from './WorkerBentoTelemetry';

describe('WorkerBentoTelemetry', () => {
  const mockData: BentoTelemetryData = {
    averageHourlyRateTry: 185,
    rateTrendPercent: 12,
    reliabilityScorePercent: 99,
    weeklyHoursCompleted: 32,
    weeklyHoursTarget: 40,
    distanceToNextVenueM: 450,
    venueName: 'Kadıköy Marina',
  };

  it('renders all four bento tiles with formatted metrics', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WorkerBentoTelemetry data={mockData} />,
      );
    });

    const root = renderer!.root;
    const container = root.findByProps({ testID: 'c.workerBentoTelemetry' });
    expect(container).toBeTruthy();

    const velocityTile = root.findByProps({
      accessibilityLabel: 'Kazanım Hızı: saatte 185 TL',
    });
    expect(velocityTile).toBeTruthy();

    const reliabilityTile = root.findByProps({
      accessibilityLabel: 'Güvenilirlik Endeksi: yüzde 99',
    });
    expect(reliabilityTile).toBeTruthy();

    const hoursTile = root.findByProps({
      accessibilityLabel: 'Haftalık Hedef: 32 bölü 40 saat',
    });
    expect(hoursTile).toBeTruthy();

    const proximityTile = root.findByProps({
      accessibilityLabel: 'Konum Mesafesi: 450 m',
    });
    expect(proximityTile).toBeTruthy();
  });

  it('triggers onTilePress when a tile is tapped', () => {
    const onTilePressMock = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WorkerBentoTelemetry data={mockData} onTilePress={onTilePressMock} />,
      );
    });

    const root = renderer!.root;
    const velocityTile = root.findByProps({
      accessibilityLabel: 'Kazanım Hızı: saatte 185 TL',
    });

    ReactTestRenderer.act(() => {
      velocityTile.props.onPress();
    });

    expect(onTilePressMock).toHaveBeenCalledWith('velocity');
  });
});
