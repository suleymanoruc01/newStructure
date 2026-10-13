import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { DockTabBar, useDockItems } from '../../components/ui/RoleDock';
import { EmployerApplicantDetailScreen } from '../../features/employer/screens/EmployerApplicantDetailScreen';
import { EmployerApplicantsScreen } from '../../features/employer/screens/EmployerApplicantsScreen';
import { EmployerBranchDetailScreen } from '../../features/employer/screens/EmployerBranchDetailScreen';
import { EmployerBranchFormScreen } from '../../features/employer/screens/EmployerBranchFormScreen';
import { EmployerBranchesScreen } from '../../features/employer/screens/EmployerBranchesScreen';
import { EmployerBusinessScreen } from '../../features/employer/screens/EmployerBusinessScreen';
import { EmployerCreateWorkplaceScreen } from '../../features/employer/screens/EmployerCreateWorkplaceScreen';
import { EmployerCalendarScreen } from '../../features/employer/screens/EmployerCalendarScreen';
import { EmployerChecklistScreen } from '../../features/employer/screens/EmployerChecklistScreen';
import { EmployerCreateJobScreen } from '../../features/employer/screens/EmployerCreateJobScreen';
import { EmployerDashboardScreen } from '../../features/employer/screens/EmployerDashboardScreen';
import { EmployerFavoriteWorkersScreen } from '../../features/employer/screens/EmployerFavoriteWorkersScreen';
import { EmployerHomeScreen } from '../../features/employer/screens/EmployerHomeScreen';
import { EmployerIndustryScreen } from '../../features/employer/screens/EmployerIndustryScreen';
import { EmployerJobDetailScreen } from '../../features/employer/screens/EmployerJobDetailScreen';
import { EmployerJobsListScreen } from '../../features/employer/screens/EmployerJobsListScreen';
import { EmployerOpenDisputesScreen } from '../../features/employer/screens/EmployerOpenDisputesScreen';
import { EmployerOpsSettingsScreen } from '../../features/employer/screens/EmployerOpsSettingsScreen';
import { EmployerProfileRootScreen } from '../../features/employer/screens/EmployerProfileRootScreen';
import { EmployerShiftManualConfirmScreen } from '../../features/employer/screens/EmployerShiftManualConfirmScreen';
import { EmployerTokenTopUpScreen } from '../../features/employer/screens/EmployerTokenTopUpScreen';
import { EmployerTokensRootScreen } from '../../features/employer/screens/EmployerTokensRootScreen';
import { EmployerVerificationStatusScreen } from '../../features/employer/screens/EmployerVerificationStatusScreen';
import { SharedAbuseReportScreen } from '../../features/shared/screens/SharedAbuseReportScreen';
import { SharedAccountEmailScreen } from '../../features/shared/screens/SharedAccountEmailScreen';
import { SharedJobProcessScreen } from '../../features/shared/screens/SharedJobProcessScreen';
import { SharedSettingsScreen } from '../../features/shared/screens/SharedSettingsScreen';
import { SharedSupportRequestScreen } from '../../features/shared/screens/SharedSupportRequestScreen';
import { SharedNotificationDetailScreen } from '../../features/shared/screens/SharedNotificationDetailScreen';
import { SharedNotificationPrefsScreen } from '../../features/shared/screens/SharedNotificationPrefsScreen';
import { SharedNotificationsListScreen } from '../../features/shared/screens/SharedNotificationsListScreen';
import { SharedRatingsComposeScreen } from '../../features/shared/screens/SharedRatingsComposeScreen';
import { SharedRatingsPendingScreen } from '../../features/shared/screens/SharedRatingsPendingScreen';
import { EMPLOYER_SCREEN_TAB, MANAGER_SCREEN_TAB } from './dock-routes';
import type { EmployerStackParamList } from './employer-types';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<EmployerStackParamList>();
const JobsStack = createNativeStackNavigator<EmployerStackParamList>();
const BranchStack = createNativeStackNavigator<EmployerStackParamList>();
const ProfileStack = createNativeStackNavigator<EmployerStackParamList>();
const AlertsStack = createNativeStackNavigator<EmployerStackParamList>();

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

function accountScreens(Stack: typeof HomeStack) {
  return (
    <>
      <Stack.Screen
        component={EmployerDashboardScreen}
        name="EmployerDashboard"
        options={{ title: 'Özet' }}
      />
      <Stack.Screen
        component={EmployerCalendarScreen}
        name="EmployerCalendar"
        options={{ title: 'Takvim' }}
      />
      <Stack.Screen
        component={EmployerBusinessScreen}
        name="EmployerBusiness"
        options={{ title: 'İşletme' }}
      />
      <Stack.Screen
        component={EmployerCreateWorkplaceScreen}
        name="EmployerCreateWorkplace"
        options={{ title: 'İşyeri' }}
      />
      <Stack.Screen
        component={EmployerIndustryScreen}
        name="EmployerIndustry"
        options={{ title: 'Sektör' }}
      />
      <Stack.Screen
        component={EmployerChecklistScreen}
        name="EmployerChecklist"
        options={{ title: 'Kurulum' }}
      />
      <Stack.Screen
        component={EmployerOpsSettingsScreen}
        name="EmployerOpsSettings"
        options={{ title: 'Ayarlar' }}
      />
      <Stack.Screen
        component={EmployerBranchFormScreen}
        name="EmployerBranchForm"
        options={{ title: 'Şube' }}
      />
      <Stack.Screen
        component={EmployerBranchDetailScreen}
        name="EmployerBranchDetail"
        options={{ title: 'Şube' }}
      />
      <Stack.Screen
        component={SharedSettingsScreen}
        name="SharedSettings"
        options={{ title: 'Hesap' }}
      />
      <Stack.Screen
        component={SharedAccountEmailScreen}
        name="SharedAccountEmail"
        options={{ title: 'E-posta' }}
      />
      <Stack.Screen
        component={SharedJobProcessScreen}
        name="SharedJobProcess"
        options={{ title: 'Süreç' }}
      />
    </>
  );
}

function opsScreens(Stack: typeof HomeStack) {
  return (
    <>
      <Stack.Screen
        component={EmployerTokensRootScreen}
        name="EmployerTokensRoot"
        options={{ title: 'Jetonlar' }}
      />
      <Stack.Screen
        component={EmployerTokenTopUpScreen}
        name="EmployerTokenTopUp"
        options={{ title: 'Jeton yükle' }}
      />
      <Stack.Screen
        component={EmployerOpenDisputesScreen}
        name="EmployerOpenDisputes"
        options={{ title: 'Check-in itirazları' }}
      />
      <Stack.Screen
        component={EmployerShiftManualConfirmScreen}
        name="EmployerShiftManualConfirm"
        options={{ title: 'Manuel onay' }}
      />
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

function EmployerHomeNavigator({ screenId }: { screenId?: string }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen
        component={EmployerHomeScreen}
        initialParams={screenId ? { screenId } : undefined}
        name="EmployerHomeRoot"
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        component={EmployerBranchesScreen}
        name="EmployerBranchesRoot"
        options={{ title: 'Şubeler' }}
      />
      {accountScreens(HomeStack)}
      {opsScreens(HomeStack)}
    </HomeStack.Navigator>
  );
}

function EmployerJobsNavigator() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen
        component={EmployerJobsListScreen}
        name="EmployerJobsList"
        options={{ headerShown: false, title: 'İlanlar' }}
      />
      <JobsStack.Screen
        component={EmployerCreateJobScreen}
        name="EmployerCreateJob"
        options={{ title: 'İlan oluştur' }}
      />
      <JobsStack.Screen
        component={EmployerJobDetailScreen}
        name="EmployerJobDetail"
        options={{ title: 'İlan detayı' }}
      />
      <JobsStack.Screen
        component={EmployerApplicantsScreen}
        name="EmployerApplicants"
        options={{ title: 'Başvurular' }}
      />
      <JobsStack.Screen
        component={EmployerApplicantDetailScreen}
        name="EmployerApplicantDetail"
        options={{ title: 'Başvuran' }}
      />
      <JobsStack.Screen
        component={SharedJobProcessScreen}
        name="SharedJobProcess"
        options={{ title: 'Süreç' }}
      />
      <JobsStack.Screen
        component={EmployerVerificationStatusScreen}
        name="EmployerVerificationStatus"
        options={{ title: 'Firma doğrulama' }}
      />
      <JobsStack.Screen
        component={SharedAbuseReportScreen}
        name="SharedAbuseReport"
        options={{ title: 'Şikayet' }}
      />
    </JobsStack.Navigator>
  );
}

function EmployerBranchesNavigator() {
  return (
    <BranchStack.Navigator screenOptions={{ headerShown: false }}>
      <BranchStack.Screen
        component={EmployerBranchesScreen}
        name="EmployerBranchesRoot"
      />
      <BranchStack.Screen
        component={EmployerBranchDetailScreen}
        name="EmployerBranchDetail"
        options={{ title: 'Şube' }}
      />
      <BranchStack.Screen
        component={EmployerBranchFormScreen}
        name="EmployerBranchForm"
        options={{ title: 'Şube' }}
      />
    </BranchStack.Navigator>
  );
}

function EmployerProfileNavigator({ screenId }: { screenId?: string }) {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen
        component={EmployerProfileRootScreen}
        initialParams={screenId ? { screenId } : undefined}
        name="EmployerProfileRoot"
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        component={EmployerVerificationStatusScreen}
        name="EmployerVerificationStatus"
        options={{ title: 'Firma doğrulama' }}
      />
      <ProfileStack.Screen
        component={EmployerFavoriteWorkersScreen}
        name="EmployerFavoriteWorkers"
        options={{ title: 'Favori işçiler' }}
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
      {accountScreens(ProfileStack)}
      {opsScreens(ProfileStack)}
    </ProfileStack.Navigator>
  );
}

function ManagerAlertsNavigator() {
  return (
    <AlertsStack.Navigator screenOptions={{ headerShown: false }}>
      <AlertsStack.Screen
        component={SharedNotificationsListScreen}
        name="SharedNotificationsList"
        options={{ headerShown: false, title: 'Uyarılar' }}
      />
      <AlertsStack.Screen
        component={SharedNotificationDetailScreen}
        name="SharedNotificationDetail"
        options={{ title: 'Bildirim' }}
      />
      <AlertsStack.Screen
        component={SharedNotificationPrefsScreen}
        name="SharedNotificationPrefs"
        options={{ title: 'Bildirim tercihleri' }}
      />
    </AlertsStack.Navigator>
  );
}

function EmployerHomeTab() {
  return <EmployerHomeNavigator />;
}

function ManagerHomeTab() {
  return <EmployerHomeNavigator screenId="m.manager.home.root" />;
}

function EmployerProfileTab() {
  return <EmployerProfileNavigator />;
}

function ManagerProfileTab() {
  return <EmployerProfileNavigator screenId="m.manager.profile.root" />;
}

export function EmployerStackNavigator({
  role,
}: {
  role: 'employer' | 'manager';
}) {
  const manager = role === 'manager';
  const { items, badgeKey } = useDockItems(manager ? 'manager' : 'employer');
  return (
    <Tab.Navigator
      screenOptions={{ animation: 'none', headerShown: false, tabBarStyle }}
      tabBar={(props) => (
        <DockTabBar
          {...props}
          badgeKey={badgeKey}
          items={items}
          screenTab={manager ? MANAGER_SCREEN_TAB : EMPLOYER_SCREEN_TAB}
        />
      )}
    >
      {manager ? (
        <>
          <Tab.Screen component={ManagerHomeTab} name="ManagerHome" />
          <Tab.Screen component={EmployerJobsNavigator} name="ManagerJobs" />
          <Tab.Screen component={ManagerAlertsNavigator} name="ManagerAlerts" />
          <Tab.Screen component={ManagerProfileTab} name="ManagerProfile" />
        </>
      ) : (
        <>
          <Tab.Screen component={EmployerHomeTab} name="EmployerHome" />
          <Tab.Screen component={EmployerJobsNavigator} name="EmployerJobs" />
          <Tab.Screen
            component={EmployerBranchesNavigator}
            name="EmployerBranches"
          />
          <Tab.Screen component={EmployerProfileTab} name="EmployerProfile" />
        </>
      )}
    </Tab.Navigator>
  );
}
