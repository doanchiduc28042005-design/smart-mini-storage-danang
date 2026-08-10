import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyOrders } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'WAITING_FOR_RETURN': { label: '⏳ Chờ Trả Hàng', color: '#c2410c', bg: '#ffedd5' },
  'RETURNING': { label: '🚚 Đang Trả', color: '#0f766e', bg: '#ccfbf1' },
  'RETURNED': { label: '✅ Đã Trả', color: '#10b981', bg: '#d1fae5' },
};

export default function CustomerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await getMyOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (o.order_id.toLowerCase().includes(q)) return true;
    if (o.items && o.items.some(i => i.item_description.toLowerCase().includes(q))) return true;
    return false;
  });

  const activeOrders = filtered.filter(o => o.status !== 'RETURNED');
  const completedOrders = filtered.filter(o => o.status === 'RETURNED');
  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>📦 Đơn hàng của tôi</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm kiếm theo mã đơn, nội dung..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          spellCheck={false}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Đang xử lý ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Hoàn thành ({completedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
        showsVerticalScrollIndicator={false}
      >
        {displayOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'Không có đơn đang xử lý' : 'Chưa có đơn hoàn thành'}
            </Text>
          </View>
        ) : (
          displayOrders.map((order) => {
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
                  <Text style={styles.orderItems} numberOfLines={2}>
                    {order.items.map(i => `📦 ${i.size}: ${i.item_description}`).join('\n')}
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
                  🕐 Tạo: {new Date(order.created_at).toLocaleString('vi-VN')}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#f3f4f6',
    borderRadius: 10, padding: 3, marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#ffffff', elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#4f46e5' },
  scroll: { flex: 1 },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 12,
    padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
  },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  orderCard: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: '#ffffff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderItems: { fontSize: 13, color: '#374151', marginTop: 8, lineHeight: 20 },
  orderAddress: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  orderShipping: { fontSize: 12, color: '#4f46e5', fontWeight: '500', marginTop: 4 },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  monthBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  monthBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  monthBtnText: { fontSize: 14, color: '#374151' },
  monthBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
