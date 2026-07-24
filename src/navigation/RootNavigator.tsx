import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { color, font } from '../theme/tokens';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { MoreStackNavigator } from './MoreStackNavigator';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Dashboard: '📈',
  Bookings: '📅',
  Payments: '💳',
  More: '⋯',
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.gold,
        tabBarInactiveTintColor: color.textOnDarkFaint,
        tabBarStyle: {
          backgroundColor: color.chromeNavy,
          borderTopWidth: 0,
          position: 'absolute',
          height: 78,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView intensity={50} tint="dark" style={{ flex: 1 }} />
        ),
        tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 11 },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="More" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
}