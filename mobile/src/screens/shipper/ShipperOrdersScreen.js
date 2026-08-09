import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getShipperOrders } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'WAITING_FOR_RETURN': { label: '⏳ Chờ Trả Hàng', color: '#c2410c', bg: '#ffedd5' },
  'RETURNING': { label: '🚚 Đang Trả', color: '#0f766e', bg: '#ccfbf1' },
  'RETURNED': { label: '✅ Đã Trả', color: '#10b981', bg: '#d1fae5' },
};

export default function ShipperOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      if (user?.id) {
        const res = await getShipperOrders(user.id);
        setOrders(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#10b981" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>📋 Lịch sử đơn hàng</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={styles.emptyText}>Chưa có đơn nào</Text>
          </View>
        ) : (
          orders.map((order) => {
            const st = statusLabels[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            return (
              <View key={order.order_id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.order_id}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>👤 {order.customer_name}</Text>
                {order.pickup_address && <Text style={styles.orderAddress}>📍 {order.pickup_address}</Text>}
                <Text style={styles.orderDate}>🕐 {new Date(order.created_at).toLocaleString('vi-VN')}</Text>
              </View>
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
  emptyCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  orderCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderCustomer: { fontSize: 13, color: '#374151', marginTop: 8 },
  orderAddress: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
});
