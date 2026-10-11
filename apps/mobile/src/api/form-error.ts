import { ApiClientError } from './client';

type Translate = (key: string, opts?: { defaultValue?: string }) => string;

export function formErrorMessage(err: unknown, t: Translate): string {
  if (err instanceof ApiClientError) {
    if (err.code === 'VALIDATION_FAILED' || err.code === 'EMPLOYER_UNVERIFIED') {
      return err.message;
    }
    return t(`errors:${err.code}`, { defaultValue: err.message });
  }
  return t('common:networkError');
}
