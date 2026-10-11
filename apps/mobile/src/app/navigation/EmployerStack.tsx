import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { SharedRatingsComposeScreen } from '../../features/shared/screens/SharedRatingsComposeScreen';
import { SharedRatingsPendingScreen } from '../../features/shared/screens/SharedRatingsPendingScreen';
import { EmployerApplicantsScreen } from '../../features/employer/screens/EmployerApplicantsScreen';
import { EmployerCreateJobScreen } from '../../features/employer/screens/EmployerCreateJobScreen';
import { EmployerJobDetailScreen } from '../../features/employer/screens/EmployerJobDetailScreen';
import { EmployerFavoriteWorkersScreen } from '../../features/employer/screens/EmployerFavoriteWorkersScreen';
import { EmployerJobsListScreen } from '../../features/employer/screens/EmployerJobsListScreen';
import { EmployerOpenDisputesScreen } from '../../features/employer/screens/EmployerOpenDisputesScreen';
import { EmployerVerificationStatusScreen } from '../../features/employer/screens/EmployerVerificationStatusScreen';
import { EmployerShiftManualConfirmScreen } from '../../features/employer/screens/EmployerShiftManualConfirmScreen';
import { EmployerTokenTopUpScreen } from '../../features/employer/screens/EmployerTokenTopUpScreen';
import { EmployerTokensRootScreen } from '../../features/employer/screens/EmployerTokensRootScreen';
import type { EmployerStackParamList } from './employer-types';

const Stack = createNativeStackNavigator<EmployerStackParamList>();

export function EmployerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="EmployerJobsList"
        component={EmployerJobsListScreen}
        options={{ title: 'İlanlar' }}
      />
      <Stack.Screen
        name="EmployerCreateJob"
        component={EmployerCreateJobScreen}
        options={{ title: 'İlan oluştur' }}
      />
      <Stack.Screen
        name="EmployerJobDetail"
        component={EmployerJobDetailScreen}
        options={{ title: 'İlan detayı' }}
      />
      <Stack.Screen
        name="EmployerApplicants"
        component={EmployerApplicantsScreen}
        options={{ title: 'Başvurular' }}
      />
      <Stack.Screen
        name="EmployerFavoriteWorkers"
        component={EmployerFavoriteWorkersScreen}
        options={{ title: 'Favori işçiler' }}
      />
      <Stack.Screen
        name="EmployerVerificationStatus"
        component={EmployerVerificationStatusScreen}
        options={{ title: 'Firma doğrulama' }}
      />
      <Stack.Screen
        name="EmployerOpenDisputes"
        component={EmployerOpenDisputesScreen}
        options={{ title: 'Check-in itirazları' }}
      />
      <Stack.Screen
        name="EmployerTokensRoot"
        component={EmployerTokensRootScreen}
        options={{ title: 'Jetonlar' }}
      />
      <Stack.Screen
        name="EmployerTokenTopUp"
        component={EmployerTokenTopUpScreen}
        options={{ title: 'Jeton yükle' }}
      />
      <Stack.Screen
        name="EmployerShiftManualConfirm"
        component={EmployerShiftManualConfirmScreen}
        options={{ title: 'Manuel onay' }}
      />
      <Stack.Screen
        name="SharedRatingsPending"
        component={SharedRatingsPendingScreen}
        options={{ title: 'Değerlendirmeler' }}
      />
      <Stack.Screen
        name="SharedRatingsCompose"
        component={SharedRatingsComposeScreen}
        options={{ title: 'Puan ver' }}
      />
    </Stack.Navigator>
  );
}
