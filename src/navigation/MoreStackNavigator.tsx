import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreHubScreen } from '../screens/MoreHubScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { MembershipScreen } from '../screens/MembershipScreen';
import { StaffScreen } from '../screens/StaffScreen';
import { EquipmentScreen } from '../screens/EquipmentScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ReportDetailScreen } from '../screens/ReportDetailScreen';
import { SuggestionsScreen } from '../screens/SuggestionsScreen';
import { PricingScreen } from '../screens/PricingScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { MarketingScreen } from '../screens/MarketingScreen';
import { CustomerListScreen } from '../screens/CustomerListScreen';
import { CustomerDetailScreen } from '../screens/CustomerDetailScreen';
import { AutomationScreen } from '../screens/AutomationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export function MoreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHub" component={MoreHubScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Membership" component={MembershipScreen} />
      <Stack.Screen name="Staff" component={StaffScreen} />
      <Stack.Screen name="Equipment" component={EquipmentScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Marketing" component={MarketingScreen} />
      <Stack.Screen name="CRM" component={CustomerListScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen name="Automation" component={AutomationScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}