import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { WizardSteps } from '../../../components/ui/WizardSteps';
import { ModulePage } from '../../../components/ui/ScreenModules';
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
    { title: t('tutorial.slide3Title'), body: t('tutorial.slide3Body') },
    { title: t('tutorial.slide4Title'), body: t('tutorial.slide4Body') },
  ];

  const current = slides[slide] ?? slides[0];

  return (
    <ModulePage
      eyebrow="PartOn"
      scroll={false}
      testID={SCREEN_IDS.tutorial}
      title={t('tutorial.title')}
    >
      <View className="flex-1 justify-between">
        <View>
          <WizardSteps step={slide + 1} total={slides.length} />
          <JobCard title={current.title}>
            <Text className="font-sans text-base leading-6 text-text-medium">
              {current.body}
            </Text>
          </JobCard>
        </View>
        <View className="gap-3 pb-4">
          {slide < slides.length - 1 ? (
            <>
              <Button
                label={t('common:continue')}
                onPress={() => setSlide(slide + 1)}
                shape="capsule"
              />
              <Button
                label={t('common:skip')}
                onPress={goPhone}
                shape="capsule"
                variant="secondary"
              />
            </>
          ) : (
            <Button label={t('tutorial.done')} onPress={goPhone} shape="capsule" />
          )}
        </View>
      </View>
    </ModulePage>
  );
}
