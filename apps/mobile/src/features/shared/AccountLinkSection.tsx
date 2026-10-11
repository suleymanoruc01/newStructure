import type { IdentityProvider } from '@parton/api-contracts';
import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../api/client';
import {
  fetchIdentityProviders,
  linkIdentity,
  listLinkedIdentities,
} from '../../api/auth-api';
import { Button } from '../../components/ui/Button';
import { getAccessToken } from '../../shared/auth/session-memory';
import {
  platformIdentityProvider,
  requestIdentityToken,
} from '../auth/linked-sign-in';

export function AccountLinkSection() {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const provider = platformIdentityProvider();
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!provider) {
      return;
    }
    const token = getAccessToken();
    if (!token) {
      return;
    }
    const data = await listLinkedIdentities(token);
    setLinked(data.items.some((item) => item.provider === provider));
  }, [provider]);

  useEffect(() => {
    void load().catch(() => {
      setError(t('common:networkError'));
    });
  }, [load, t]);

  const onLink = async () => {
    if (!provider) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const setup = await fetchIdentityProviders();
      const clientId = clientIdFor(provider, setup);
      if (!clientId) {
        throw new ApiClientError(
          t('auth:identity.notConfigured'),
          503,
          'IDENTITY_NOT_CONFIGURED',
        );
      }
      const idToken = await requestIdentityToken(provider, clientId);
      await linkIdentity({ provider, idToken }, token);
      setLinked(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('errors:IDENTITY_TOKEN_INVALID'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!provider) {
    return null;
  }

  const label =
    provider === 'apple'
      ? t('auth:identity.appleLink')
      : t('auth:identity.googleLink');

  return (
    <>
      <Text className="font-sans mt-8 text-base text-text-medium">
        {t('auth:identity.linkHint')}
      </Text>
      {linked ? (
        <Text className="font-sans mt-3 text-base font-semibold text-text-high">
          {t('auth:identity.linked')}
        </Text>
      ) : (
        <Button
          disabled={submitting}
          label={submitting ? t('common:loading') : label}
          onPress={() => void onLink()}
          testID="account-link"
          variant="secondary"
        />
      )}
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </>
  );
}

function clientIdFor(
  provider: IdentityProvider,
  setup: { appleClientId: string | null; googleClientId: string | null },
): string | null {
  switch (provider) {
    case 'apple':
      return setup.appleClientId;
    case 'google':
      return setup.googleClientId;
    default: {
      const neverProvider: never = provider;
      return neverProvider;
    }
  }
}
