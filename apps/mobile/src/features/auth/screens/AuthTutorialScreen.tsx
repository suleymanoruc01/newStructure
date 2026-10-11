import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { SCREEN_IDS } from '../screen-ids';

const TUTORIAL_SEEN_KEY = '@parton/tutorial_seen';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthTutorial'>;

export async function hasSeenTutorial(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
  return value === '1';
}

async function markTutorialSeen(): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, '1');
}

export function AuthTutorialScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common']);
  const [slide, setSlide] = useState(0);

  const goPhone = () => {
    void markTutorialSeen();
    navigation.replace('AuthPhone');
  };

  const slides = [
    { title: t('tutorial.slide1Title'), body: t('tutorial.slide1Body') },
    { title: t('tutorial.slide2Title'), body: t('tutorial.slide2Body') },
  ];

  const current = slides[slide];

  return (
    <Screen testID={SCREEN_IDS.tutorial}>
      <View className="flex-1 justify-between">
        <View className="mt-8">
          <Text className="text-2xl font-bold text-text-high">
            {t('tutorial.title')}
          </Text>
          <View className="mt-8 rounded-2xl bg-surface-1 p-6">
            <Text className="text-xl font-semibold text-forest">
              {current.title}
            </Text>
            <Text className="mt-3 text-base text-text-medium">{current.body}</Text>
          </View>
        </View>
        <View className="gap-3 pb-4">
          {slide < slides.length - 1 ? (
            <>
              <Button label={t('common:continue')} onPress={() => setSlide(slide + 1)} />
              <Button label={t('common:skip')} onPress={goPhone} variant="ghost" />
            </>
          ) : (
            <Button label={t('tutorial.done')} onPress={goPhone} />
          )}
        </View>
      </View>
    </Screen>
  );
}
