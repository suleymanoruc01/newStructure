import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { StatStrip } from './StatStrip';

describe('StatStrip', () => {
  it('renders all stat items with values, labels, and trend indicators', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <StatStrip
          items={[
            { label: 'Aktif Vardiya', value: '4', tone: 'strong', trend: 'CANLI' },
            { label: 'Açık İlanlar', value: '18', tone: 'accent' },
            { label: 'Başvurular', value: '32', tone: 'default' },
          ]}
        />,
      );
    });

    const root = renderer!.root;
    const tree = renderer?.toJSON();
    expect(tree).toBeDefined();

    const str = JSON.stringify(tree);
    expect(str).toContain('Aktif Vardiya');
    expect(str).toContain('4');
    expect(str).toContain('CANLI');
    expect(str).toContain('Açık İlanlar');
    expect(str).toContain('18');
    expect(str).toContain('Başvurular');
    expect(str).toContain('32');
  });
});
