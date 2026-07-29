import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders, getNotifications } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'DELIVERED': { label: '✅ Đã Giao', color: '#10b981', bg: '#d1fae5' },
};

export default function CustomerHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, notifsRes] = await Promise.allSettled([
        getMyOrders(),
        getNotifications(),
      ]);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
      if (notifsRes.status === 'fulfilled') {
        setUnreadNotifs(notifsRes.value.data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
  const completedCount = orders.filter(o => o.status === 'DELIVERED').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userInfo}>📧 {user?.email} • 📞 {user?.phone}</Text>
          </View>
        </View>

        {/* CTA Card */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => navigation.navigate('CreateOrder')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.ctaTitle}>📦 Cần gửi đồ vào kho?</Text>
            <Text style={styles.ctaSubtitle}>Đặt lịch shipper đến lấy hàng chỉ trong vài phút</Text>
          </View>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>+ Tạo Đơn Mới</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#eef2ff' }]}>
            <Text style={[styles.statNumber, { color: '#4f46e5' }]}>{orders.length}</Text>
            <Text style={styles.statLabel}>Tổng đơn</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Đang xử lý</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        {/* Account Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Thông tin tài khoản</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Họ tên</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{user?.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Địa chỉ mặc định</Text>
              <Text style={styles.infoValue}>📍 {user?.default_pickup_address || '(chưa thiết lập)'}</Text>
            </View>
          </View>
        </View>

        {/* Active Orders Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔄 Đơn đang xử lý ({activeOrders.length})</Text>
          {activeOrders.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.seeAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={styles.emptyText}>Bạn chưa có đơn nào đang xử lý</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateOrder')}
            >
              <Text style={styles.emptyButtonText}>+ Tạo Đơn Đầu Tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeOrders.slice(0, 3).map((order) => {
            const st = statusLabels[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            return (
              <TouchableOpacity
                key={order.order_id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.order_id })}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.order_id}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                {order.items && order.items.length > 0 && (
                  <Text style={styles.orderItems} numberOfLines={1}>
                    {order.items.map(i => `${i.size}: ${i.item_description}`).join(', ')}
                  </Text>
                )}
                {order.pickup_address && (
                  <Text style={styles.orderAddress} numberOfLines={1}>📍 {order.pickup_address}</Text>
                )}
                {order.delivery_method && (
                  <Text style={styles.orderShipping}>
                    🚚 {order.delivery_method === 'self_pickup' ? 'Tự mang đến' : 'Giao tận nơi'} 
                    {order.shipping_fee > 0 ? ` • ${order.shipping_fee.toLocaleString('vi-VN')}đ` : ' • Miễn phí'}
                  </Text>
                )}
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </Text>
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
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14, color: '#6b7280' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  userInfo: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  ctaCard: {
    marginHorizontal: 20, marginTop: 16, padding: 20, borderRadius: 16,
    backgroundColor: '#4f46e5', gap: 12,
  },
  ctaTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  ctaSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  ctaButton: {
    backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 10, alignSelf: 'flex-start', marginTop: 4,
  },
  ctaButtonText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 15 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  card: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#ffffff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  infoGrid: { gap: 12 },
  infoItem: { gap: 2 },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  seeAll: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 12,
    padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
  },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  emptyButton: {
    marginTop: 16, backgroundColor: '#eef2ff', paddingVertical: 10,
    paddingHorizontal: 20, borderRadius: 8,
  },
  emptyButtonText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
  orderCard: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: '#ffffff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderItems: { fontSize: 13, color: '#374151', marginTop: 8 },
  orderAddress: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  orderShipping: { fontSize: 12, color: '#4f46e5', fontWeight: '500', marginTop: 4 },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
});
