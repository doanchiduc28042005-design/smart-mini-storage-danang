import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import ShipperHomeScreen from '../screens/shipper/ShipperHomeScreen';
import ShipperScanScreen from '../screens/shipper/ShipperScanScreen';
import ShipperOrdersScreen from '../screens/shipper/ShipperOrdersScreen';
import ShipperProfileScreen from '../screens/shipper/ShipperProfileScreen';

const Tab = createBottomTabNavigator();

export default function ShipperNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarIcon: ({ color }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🏠';
          if (route.name === 'Scan') icon = '📷';
          if (route.name === 'History') icon = '📋';
          if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 22 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={ShipperHomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Scan" component={ShipperScanScreen} options={{ tabBarLabel: 'Quét QR' }} />
      <Tab.Screen name="History" component={ShipperOrdersScreen} options={{ tabBarLabel: 'Lịch sử' }} />
      <Tab.Screen name="Profile" component={ShipperProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
    </Tab.Navigator>
  );
}
