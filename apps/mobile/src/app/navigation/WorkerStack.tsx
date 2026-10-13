import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { DockTabBar, useDockItems } from '../../components/ui/RoleDock';
import { SharedAbuseReportScreen } from '../../features/shared/screens/SharedAbuseReportScreen';
import { SharedSupportRequestScreen } from '../../features/shared/screens/SharedSupportRequestScreen';
import { SharedNotificationDetailScreen } from '../../features/shared/screens/SharedNotificationDetailScreen';
import { SharedNotificationPrefsScreen } from '../../features/shared/screens/SharedNotificationPrefsScreen';
import { SharedNotificationsListScreen } from '../../features/shared/screens/SharedNotificationsListScreen';
import { SharedRatingsComposeScreen } from '../../features/shared/screens/SharedRatingsComposeScreen';
import { SharedRatingsPendingScreen } from '../../features/shared/screens/SharedRatingsPendingScreen';
import { WorkerApplicationsListScreen } from '../../features/worker/screens/WorkerApplicationsListScreen';
import { WorkerAvailabilityEditScreen } from '../../features/worker/screens/WorkerAvailabilityEditScreen';
import { WorkerCalendarScreen } from '../../features/worker/screens/WorkerCalendarScreen';
import { WorkerDocumentsListScreen } from '../../features/worker/screens/WorkerDocumentsListScreen';
import { WorkerDocumentsUploadScreen } from '../../features/worker/screens/WorkerDocumentsUploadScreen';
import { WorkerFavoritesListScreen } from '../../features/worker/screens/WorkerFavoritesListScreen';
import { WorkerHomeScreen } from '../../features/worker/screens/WorkerHomeScreen';
import { WorkerJobApplyScreen } from '../../features/worker/screens/WorkerJobApplyScreen';
import { WorkerJobDetailScreen } from '../../features/worker/screens/WorkerJobDetailScreen';
import { WorkerJobsListScreen } from '../../features/worker/screens/WorkerJobsListScreen';
import { WorkerProfileEditScreen } from '../../features/worker/screens/WorkerProfileEditScreen';
import { WorkerProfileRootScreen } from '../../features/worker/screens/WorkerProfileRootScreen';
import { SharedAccountEmailScreen } from '../../features/shared/screens/SharedAccountEmailScreen';
import { SharedJobProcessScreen } from '../../features/shared/screens/SharedJobProcessScreen';
import { SharedSettingsScreen } from '../../features/shared/screens/SharedSettingsScreen';
import { WorkerShiftAvailabilityScreen } from '../../features/worker/screens/WorkerShiftAvailabilityScreen';
import { WorkerShiftCheckInScreen } from '../../features/worker/screens/WorkerShiftCheckInScreen';
import { WorkerShiftCheckOutScreen } from '../../features/worker/screens/WorkerShiftCheckOutScreen';
import { WorkerShiftDisputeScreen } from '../../features/worker/screens/WorkerShiftDisputeScreen';
import { WorkerShiftInShiftScreen } from '../../features/worker/screens/WorkerShiftInShiftScreen';
import { WorkerShiftPrepScreen } from '../../features/worker/screens/WorkerShiftPrepScreen';
import { WorkerRevenueScreen } from '../../features/worker/screens/WorkerRevenueScreen';
import { WORKER_SCREEN_TAB } from './dock-routes';
import type { WorkerStackParamList } from './worker-types';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<WorkerStackParamList>();
const JobsStack = createNativeStackNavigator<WorkerStackParamList>();
const CalendarStack = createNativeStackNavigator<WorkerStackParamList>();
const ProfileStack = createNativeStackNavigator<WorkerStackParamList>();

const tabBarStyle = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  elevation: 0,
  overflow: 'visible' as const,
};

function workerShiftScreens(Stack: typeof HomeStack) {
  return (
    <>
      <Stack.Screen
        component={WorkerShiftAvailabilityScreen}
        name="WorkerShiftAvailability"
        options={{ title: '3 saat teyidi' }}
      />
      <Stack.Screen
        component={WorkerShiftPrepScreen}
        name="WorkerShiftPrep"
        options={{ title: 'Hazırlık' }}
      />
      <Stack.Screen
        component={WorkerShiftCheckInScreen}
        name="WorkerShiftCheckIn"
        options={{ title: 'Check-in' }}
      />
      <Stack.Screen
        component={WorkerShiftInShiftScreen}
        name="WorkerShiftInShift"
        options={{ title: 'Aktif vardiya' }}
      />
      <Stack.Screen
        component={WorkerShiftCheckOutScreen}
        name="WorkerShiftCheckOut"
        options={{ title: 'Check-out' }}
      />
      <Stack.Screen
        component={WorkerShiftDisputeScreen}
        name="WorkerShiftDispute"
        options={{ title: 'İtiraz' }}
      />
      <Stack.Screen
        component={SharedRatingsPendingScreen}
        name="SharedRatingsPending"
        options={{ title: 'Değerlendirmeler' }}
      />
      <Stack.Screen
        component={SharedRatingsComposeScreen}
        name="SharedRatingsCompose"
        options={{ title: 'Puan ver' }}
      />
    </>
  );
}

function workerInboxScreens(Stack: typeof HomeStack) {
  return (
    <>
      <Stack.Screen
        component={SharedNotificationsListScreen}
        name="SharedNotificationsList"
        options={{ title: 'Bildirimler' }}
      />
      <Stack.Screen
        component={SharedNotificationDetailScreen}
        name="SharedNotificationDetail"
        options={{ title: 'Bildirim' }}
      />
      <Stack.Screen
        component={SharedNotificationPrefsScreen}
        name="SharedNotificationPrefs"
        options={{ title: 'Bildirim tercihleri' }}
      />
    </>
  );
}

function WorkerHomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen
        component={WorkerHomeScreen}
        name="WorkerHomeRoot"
        options={{ headerShown: false }}
      />
      {workerShiftScreens(HomeStack)}
      {workerInboxScreens(HomeStack)}
    </HomeStack.Navigator>
  );
}

function WorkerJobsNavigator() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen
        component={WorkerJobsListScreen}
        name="WorkerJobsList"
        options={{ headerShown: false, title: 'İşler' }}
      />
      <JobsStack.Screen
        component={WorkerJobDetailScreen}
        name="WorkerJobDetail"
        options={{ title: 'İlan' }}
      />
      <JobsStack.Screen
        component={WorkerJobApplyScreen}
        name="WorkerJobApply"
        options={{ title: 'Başvuru' }}
      />
    </JobsStack.Navigator>
  );
}

function WorkerCalendarNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen
        component={WorkerCalendarScreen}
        name="WorkerCalendarRoot"
        options={{ headerShown: false }}
      />
      <CalendarStack.Screen
        component={WorkerAvailabilityEditScreen}
        name="WorkerAvailabilityEdit"
        options={{ title: 'Müsaitlik' }}
      />
    </CalendarStack.Navigator>
  );
}

function WorkerProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen
        component={WorkerProfileRootScreen}
        name="WorkerProfileRoot"
        options={{ headerShown: false, title: 'Profil' }}
      />
      <ProfileStack.Screen
        component={WorkerProfileEditScreen}
        name="WorkerProfileEdit"
        options={{ title: 'Profili düzenle' }}
      />
      <ProfileStack.Screen
        component={WorkerApplicationsListScreen}
        name="WorkerApplicationsList"
        options={{ title: 'Başvurularım' }}
      />
      <ProfileStack.Screen
        component={SharedJobProcessScreen}
        name="SharedJobProcess"
        options={{ title: 'Süreç' }}
      />
      <ProfileStack.Screen
        component={WorkerRevenueScreen}
        name="WorkerRevenue"
        options={{ title: 'Kazanç' }}
      />
      <ProfileStack.Screen
        component={SharedSettingsScreen}
        name="SharedSettings"
        options={{ title: 'Hesap' }}
      />
      <ProfileStack.Screen
        component={SharedAccountEmailScreen}
        name="SharedAccountEmail"
        options={{ title: 'E-posta' }}
      />
      <ProfileStack.Screen
        component={WorkerFavoritesListScreen}
        name="WorkerFavoritesList"
        options={{ title: 'Favoriler' }}
      />
      <ProfileStack.Screen
        component={WorkerDocumentsListScreen}
        name="WorkerDocumentsList"
        options={{ title: 'Belgeler' }}
      />
      <ProfileStack.Screen
        component={WorkerDocumentsUploadScreen}
        name="WorkerDocumentsUpload"
        options={{ title: 'Belge yükle' }}
      />
      <ProfileStack.Screen
        component={SharedAbuseReportScreen}
        name="SharedAbuseReport"
        options={{ title: 'Şikayet' }}
      />
      <ProfileStack.Screen
        component={SharedSupportRequestScreen}
        name="SharedSupportRequest"
        options={{ title: 'Destek' }}
      />
      <ProfileStack.Screen
        component={SharedRatingsPendingScreen}
        name="SharedRatingsPending"
        options={{ title: 'Değerlendirmeler' }}
      />
      <ProfileStack.Screen
        component={SharedRatingsComposeScreen}
        name="SharedRatingsCompose"
        options={{ title: 'Puan ver' }}
      />
      {workerInboxScreens(ProfileStack)}
    </ProfileStack.Navigator>
  );
}

export function WorkerStackNavigator() {
  const { items, badgeKey } = useDockItems('worker');
  return (
    <Tab.Navigator
      screenOptions={{ animation: 'none', headerShown: false, tabBarStyle }}
      tabBar={(props) => (
        <DockTabBar
          {...props}
          badgeKey={badgeKey}
          items={items}
          screenTab={WORKER_SCREEN_TAB}
        />
      )}
    >
      <Tab.Screen component={WorkerHomeNavigator} name="WorkerHome" />
      <Tab.Screen component={WorkerJobsNavigator} name="WorkerJobs" />
      <Tab.Screen component={WorkerCalendarNavigator} name="WorkerCalendar" />
      <Tab.Screen component={WorkerProfileNavigator} name="WorkerProfile" />
    </Tab.Navigator>
  );
}
