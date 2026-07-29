import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getShipperOrders } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'DELIVERED': { label: '✅ Đã Giao', color: '#10b981', bg: '#d1fae5' },
};

export default function ShipperHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
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

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Xin chào Shipper 🚚</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.shipperCode}>Mã: {user?.shipper_code}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{orders.length}</Text>
            <Text style={styles.statLabel}>Tổng đơn</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Đang xử lý</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          style={styles.scanCta}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.85}
        >
          <Text style={styles.scanCtaTitle}>📷 Quét QR để cập nhật đơn hàng</Text>
          <Text style={styles.scanCtaSubtitle}>Quét mã QR trên thùng để thay đổi trạng thái</Text>
        </TouchableOpacity>

        {/* Active Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔄 Đơn đang xử lý ({activeOrders.length})</Text>
        </View>

        {activeOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={styles.emptyText}>Không có đơn đang xử lý</Text>
          </View>
        ) : (
          activeOrders.map((order) => {
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
                {order.pickup_address && (
                  <Text style={styles.orderAddress}>📍 {order.pickup_address}</Text>
                )}
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14, color: '#6b7280' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  shipperCode: { fontSize: 14, color: '#10b981', fontWeight: '600', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  scanCta: {
    marginHorizontal: 20, marginTop: 16, padding: 20, borderRadius: 16,
    backgroundColor: '#10b981',
  },
  scanCtaTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  scanCtaSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12,
    padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
  },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  orderCard: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderCustomer: { fontSize: 13, color: '#374151', marginTop: 8 },
  orderAddress: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
