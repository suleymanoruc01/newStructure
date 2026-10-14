import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';
import {
  changeLanguage,
  formatLocalizedCurrency,
  formatLocalizedDate,
  getCurrentLanguage,
  initializeLanguage,
  LOCALE_STORAGE_KEY,
} from './locale-manager';

describe('locale-manager', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('tr-TR');
  });

  it('retrieves default language as tr-TR', () => {
    expect(getCurrentLanguage()).toBe('tr-TR');
  });

  it('changes language and persists preference to AsyncStorage', async () => {
    await changeLanguage('en-US');

    expect(i18n.language).toBe('en-US');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, 'en-US');
    expect(getCurrentLanguage()).toBe('en-US');
  });

  it('initializes language from AsyncStorage if saved', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('en-US');

    const loaded = await initializeLanguage();
    expect(loaded).toBe('en-US');
    expect(i18n.language).toBe('en-US');
  });

  it('formats currency correctly in localized representations', () => {
    const formattedTr = formatLocalizedCurrency(150000, 'TRY', 'tr-TR');
    expect(formattedTr).toContain('1.500');

    const formattedEn = formatLocalizedCurrency(150000, 'TRY', 'en-US');
    expect(formattedEn).toContain('1,500');
  });

  it('formats dates cleanly according to target locale', () => {
    const testDate = new Date('2026-10-15T10:00:00.000Z');
    const formatted = formatLocalizedDate(testDate, { dateStyle: 'short' }, 'en-US');
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});
