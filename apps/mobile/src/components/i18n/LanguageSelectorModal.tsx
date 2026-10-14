import React from 'react';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AuroraWash } from '../ui/AuroraWash';
import { Button } from '../ui/Button';
import { ClayCard } from '../ui/ClayCard';
import { Pressable } from '../ui/Pressable';
import { claySheet } from '../ui/clay';
import {
  changeLanguage,
  getCurrentLanguage,
} from '../../shared/i18n/locale-manager';
import type { SupportedLanguage } from '../../i18n';
import { getAccessToken } from '../../shared/auth/session-memory';
import { patchMe } from '../../api/auth-api';

export type LanguageSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
};

type LanguageOption = {
  code: SupportedLanguage;
  flag: string;
  name: string;
  nativeName: string;
};

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    code: 'tr-TR',
    flag: '🇹🇷',
    name: 'Türkçe',
    nativeName: 'Türkçe (Türkiye)',
  },
  {
    code: 'en-US',
    flag: '🇺🇸',
    name: 'English',
    nativeName: 'English (United States)',
  },
];

export function LanguageSelectorModal({
  visible,
  onClose,
}: LanguageSelectorModalProps) {
  const { t } = useTranslation(['system', 'common']);
  const bottom = useSafeAreaInsets().bottom;
  const currentLang = getCurrentLanguage();
  const [selectedLang, setSelectedLang] = React.useState<SupportedLanguage>(currentLang);

  React.useEffect(() => {
    if (visible) {
      setSelectedLang(getCurrentLanguage());
    }
  }, [visible]);

  const onSelect = async (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    await changeLanguage(lang);

    // Synchronize user language preference with backend if session is active
    const token = getAccessToken();
    if (token) {
      void patchMe(token, { locale: lang }).catch(() => {
        // Non-blocking sync error
      });
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="m.language.modal"
    >
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        pressScale={false}
      >
        <Pressable
          className="overflow-hidden p-6"
          onPress={(event) => event.stopPropagation()}
          pressScale={false}
          style={[claySheet, { paddingBottom: Math.max(bottom, 24) }]}
        >
          <AuroraWash variant="cream" />
          <View pointerEvents="box-none" style={{ zIndex: 1 }}>
            <Text className="font-display text-xl font-bold text-text-high">
              {t('system:settings.languageModalTitle')}
            </Text>
            <Text className="font-sans mt-1 text-sm text-text-medium">
              {t('system:settings.languageModalSubtitle')}
            </Text>

            <View className="mt-5 gap-3">
              {LANGUAGE_OPTIONS.map((option) => {
                const isActive = selectedLang === option.code;
                return (
                  <ClayCard
                    key={option.code}
                    onPress={() => void onSelect(option.code)}
                    testID={`m.language.option.${option.code}`}
                    className={
                      isActive
                        ? 'border-2 border-primary-solid bg-primary-solid/5'
                        : 'border border-surface-border'
                    }
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className="mr-3 text-2xl">{option.flag}</Text>
                        <View>
                          <Text className="font-sans text-base font-semibold text-text-high">
                            {option.name}
                          </Text>
                          <Text className="font-sans text-xs text-text-low">
                            {option.nativeName}
                          </Text>
                        </View>
                      </View>
                      {isActive ? (
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-solid">
                          <Text className="text-xs font-bold text-white">✓</Text>
                        </View>
                      ) : null}
                    </View>
                  </ClayCard>
                );
              })}
            </View>

            <View className="mt-6">
              <Button
                label={t('common:cancel')}
                variant="secondary"
                onPress={onClose}
                testID="m.language.button.cancel"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
