import { markIfFits } from './policy-text';

test('short legal text counts as read without a wait', () => {
  expect(markIfFits({ key: 'kvkk:1', view: 400, content: 380, end: false }).end).toBe(
    true,
  );
});

test('text taller than the pane stays unread until the end', () => {
  expect(markIfFits({ key: 'kvkk:1', view: 400, content: 900, end: false }).end).toBe(
    false,
  );
});
