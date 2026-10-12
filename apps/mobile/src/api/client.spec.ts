import { ApiClientError, refreshCredentialRejected } from './api-error';

test('only a rejected refresh credential ends the stored session', () => {
  expect(
    refreshCredentialRejected(
      new ApiClientError('Oturum süresi doldu.', 401, 'SESSION_EXPIRED'),
    ),
  ).toBe(true);
  expect(
    refreshCredentialRejected(new ApiClientError('Ağ hatası.', 0, 'NETWORK')),
  ).toBe(false);
  expect(
    refreshCredentialRejected(
      new ApiClientError('CSRF doğrulaması başarısız.', 403, 'FORBIDDEN'),
    ),
  ).toBe(false);
  expect(refreshCredentialRejected(new TypeError('Network request failed'))).toBe(
    false,
  );
});
