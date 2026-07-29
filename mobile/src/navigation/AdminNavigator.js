import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminShippersScreen from '../screens/admin/AdminShippersScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminEmployeesScreen from '../screens/admin/AdminEmployeesScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={AdminOrdersScreen} />
      <Stack.Screen name="AdminOrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} />
    </Stack.Navigator>
  );
}

function MoreScreen({ navigation }) {
  const { logout } = useAuth();
  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={moreStyles.container}>
      <Text style={moreStyles.title}>⚙️ Khác</Text>
      
      <TouchableOpacity style={moreStyles.btn} onPress={() => navigation.navigate('AdminCustomers')}>
        <Text style={moreStyles.btnText}>👥 Quản lý Khách hàng</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[moreStyles.btn, moreStyles.logoutBtn]} onPress={handleLogout}>
        <Text style={moreStyles.logoutText}>🚪 Đăng xuất</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const moreStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#111827' },
  btn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  logoutBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginTop: 20 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', textAlign: 'center' },
});

export default function AdminNavigator() {
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
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarIcon: ({ color }) => {
          let icon = '📊';
          if (route.name === 'Dashboard') icon = '📊';
          if (route.name === 'Orders') icon = '📦';
          if (route.name === 'Shippers') icon = '🚚';
          if (route.name === 'Employees') icon = '👔';
          if (route.name === 'More') icon = '⚙️';
          return <Text style={{ fontSize: 22 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ tabBarLabel: 'Tổng quan' }} />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarLabel: 'Đơn hàng' }} />
      <Tab.Screen name="Shippers" component={AdminShippersScreen} options={{ tabBarLabel: 'Shipper' }} />
      <Tab.Screen name="Employees" component={AdminEmployeesScreen} options={{ tabBarLabel: 'Nhân viên' }} />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarLabel: 'Khác' }} />
    </Tab.Navigator>
  );
}
