import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrders } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'DELIVERED': { label: '✅ Đã Giao', color: '#10b981', bg: '#d1fae5' },
};

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'WAITING_FOR_PICKUP', label: 'Chờ lấy' },
  { key: 'PICKED_UP', label: 'Đã lấy' },
  { key: 'IN_HUB', label: 'Ở Hub' },
  { key: 'DELIVERED', label: 'Đã giao' },
];

export default function AdminOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await getOrders();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>📦 Quản lý đơn hàng</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map(tab => {
          const count = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={styles.emptyText}>Không có đơn hàng</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const st = statusLabels[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            return (
              <TouchableOpacity
                key={order.order_id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order.order_id })}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.order_id}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>👤 {order.customer_name}</Text>
                {order.pickup_address && <Text style={styles.orderAddress}>📍 {order.pickup_address}</Text>}
                {order.delivery_method && (
                  <Text style={styles.orderShipping}>
                    🚚 {order.delivery_method === 'self_pickup' ? 'Tự mang đến' : 'Giao tận nơi'}
                    {order.shipping_fee > 0 ? ` • ${order.shipping_fee.toLocaleString('vi-VN')}đ` : ''}
                  </Text>
                )}
                <Text style={styles.orderDate}>🕐 {new Date(order.created_at).toLocaleString('vi-VN')}</Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  tabScroll: { maxHeight: 44, marginBottom: 8 },
  tabContent: { paddingHorizontal: 16, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  emptyCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  orderCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderCustomer: { fontSize: 13, color: '#374151', marginTop: 8 },
  orderAddress: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  orderShipping: { fontSize: 12, color: '#7c3aed', fontWeight: '500', marginTop: 4 },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
});
