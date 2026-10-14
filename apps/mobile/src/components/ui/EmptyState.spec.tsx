import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, subtitle, and custom icon', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EmptyState
          title="Henüz Vardiya Yok"
          subtitle="Yeni bir ilan yayınlayarak hemen başvuruları toplayın."
          icon="⏳"
          actionLabel="İlan Oluştur"
          onAction={jest.fn()}
          testID="empty.shifts"
        />,
      );
    });

    const root = renderer!.root;
    const container = root.findByProps({ testID: 'empty.shifts' });
    expect(container).toBeTruthy();

    const tree = renderer?.toJSON();
    const str = JSON.stringify(tree);
    expect(str).toContain('Henüz Vardiya Yok');
    expect(str).toContain('Yeni bir ilan yayınlayarak');
    expect(str).toContain('⏳');
    expect(str).toContain('İlan Oluştur');
  });
});
