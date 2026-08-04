import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import CustomerOrdersScreen from '../screens/customer/CustomerOrdersScreen';
import CreateOrderScreen from '../screens/customer/CreateOrderScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import AiChatScreen from '../screens/customer/AiChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={CustomerHomeScreen} />
      <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="AiChat" component={AiChatScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={CustomerOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

export default function CustomerNavigator() {
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
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarIcon: ({ color }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🏠';
          if (route.name === 'Orders') icon = '📦';
          if (route.name === 'Notifications') icon = '🔔';
          if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 22 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarLabel: 'Đơn hàng' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Thông báo' }} />
      <Tab.Screen name="Profile" component={CustomerProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
    </Tab.Navigator>
  );
}
