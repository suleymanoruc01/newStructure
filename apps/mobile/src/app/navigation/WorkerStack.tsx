import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { SharedRatingsComposeScreen } from '../../features/shared/screens/SharedRatingsComposeScreen';
import { SharedRatingsPendingScreen } from '../../features/shared/screens/SharedRatingsPendingScreen';
import { WorkerShiftAvailabilityScreen } from '../../features/worker/screens/WorkerShiftAvailabilityScreen';
import { WorkerShiftCheckInScreen } from '../../features/worker/screens/WorkerShiftCheckInScreen';
import { WorkerShiftCheckOutScreen } from '../../features/worker/screens/WorkerShiftCheckOutScreen';
import { WorkerShiftInShiftScreen } from '../../features/worker/screens/WorkerShiftInShiftScreen';
import { WorkerShiftDisputeScreen } from '../../features/worker/screens/WorkerShiftDisputeScreen';
import { WorkerAvailabilityEditScreen } from '../../features/worker/screens/WorkerAvailabilityEditScreen';
import { WorkerDocumentsListScreen } from '../../features/worker/screens/WorkerDocumentsListScreen';
import { WorkerDocumentsUploadScreen } from '../../features/worker/screens/WorkerDocumentsUploadScreen';
import { WorkerJobApplyScreen } from '../../features/worker/screens/WorkerJobApplyScreen';
import { WorkerJobDetailScreen } from '../../features/worker/screens/WorkerJobDetailScreen';
import { WorkerApplicationsListScreen } from '../../features/worker/screens/WorkerApplicationsListScreen';
import { WorkerFavoritesListScreen } from '../../features/worker/screens/WorkerFavoritesListScreen';
import { WorkerJobsListScreen } from '../../features/worker/screens/WorkerJobsListScreen';
import { WorkerProfileEditScreen } from '../../features/worker/screens/WorkerProfileEditScreen';
import { WorkerProfileRootScreen } from '../../features/worker/screens/WorkerProfileRootScreen';
import type { WorkerStackParamList } from './worker-types';

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export function WorkerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="WorkerJobsList"
        component={WorkerJobsListScreen}
        options={{ title: 'İşler' }}
      />
      <Stack.Screen
        name="WorkerApplicationsList"
        component={WorkerApplicationsListScreen}
        options={{ title: 'Başvurularım' }}
      />
      <Stack.Screen
        name="WorkerFavoritesList"
        component={WorkerFavoritesListScreen}
        options={{ title: 'Favoriler' }}
      />
      <Stack.Screen
        name="WorkerAvailabilityEdit"
        component={WorkerAvailabilityEditScreen}
        options={{ title: 'Müsaitlik' }}
      />
      <Stack.Screen
        name="WorkerProfileRoot"
        component={WorkerProfileRootScreen}
        options={{ title: 'Profil' }}
      />
      <Stack.Screen
        name="WorkerProfileEdit"
        component={WorkerProfileEditScreen}
        options={{ title: 'Profili düzenle' }}
      />
      <Stack.Screen
        name="WorkerDocumentsList"
        component={WorkerDocumentsListScreen}
        options={{ title: 'Belgeler' }}
      />
      <Stack.Screen
        name="WorkerDocumentsUpload"
        component={WorkerDocumentsUploadScreen}
        options={{ title: 'Belge yükle' }}
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
      <Stack.Screen
        name="WorkerJobDetail"
        component={WorkerJobDetailScreen}
        options={{ title: 'İlan' }}
      />
      <Stack.Screen
        name="WorkerJobApply"
        component={WorkerJobApplyScreen}
        options={{ title: 'Başvuru' }}
      />
      <Stack.Screen
        name="WorkerShiftAvailability"
        component={WorkerShiftAvailabilityScreen}
        options={{ title: '3 saat teyidi' }}
      />
      <Stack.Screen
        name="WorkerShiftCheckIn"
        component={WorkerShiftCheckInScreen}
        options={{ title: 'Check-in' }}
      />
      <Stack.Screen
        name="WorkerShiftInShift"
        component={WorkerShiftInShiftScreen}
        options={{ title: 'Aktif vardiya' }}
      />
      <Stack.Screen
        name="WorkerShiftCheckOut"
        component={WorkerShiftCheckOutScreen}
        options={{ title: 'Check-out' }}
      />
      <Stack.Screen
        name="WorkerShiftDispute"
        component={WorkerShiftDisputeScreen}
        options={{ title: 'İtiraz' }}
      />
    </Stack.Navigator>
  );
}
