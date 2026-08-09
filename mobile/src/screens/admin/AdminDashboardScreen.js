import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getOrders } from '../../services/api';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        getDashboardStats(),
        getOrders(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  const statCards = [
    { title: 'Tổng đơn hàng', value: stats?.total_orders || orders.length, color: '#3b82f6', bg: '#dbeafe' },
    { title: 'Chờ lấy hàng', value: stats?.waiting || orders.filter(o => o.status === 'WAITING_FOR_PICKUP').length, color: '#f59e0b', bg: '#fef3c7' },
    { title: 'Đang vận chuyển', value: stats?.picked_up || orders.filter(o => o.status === 'PICKED_UP').length, color: '#8b5cf6', bg: '#ede9fe' },
    { title: 'Trong kho', value: stats?.in_hub || orders.filter(o => o.status === 'IN_HUB').length, color: '#06b6d4', bg: '#cffafe' },
    { title: 'Đã giao', value: stats?.returned || orders.filter(o => o.status === 'RETURNED').length, color: '#10b981', bg: '#d1fae5' },
    { title: 'Tổng khách hàng', value: stats?.total_customers || 0, color: '#ec4899', bg: '#fce7f3' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Dashboard Tổng Quan</Text>
          <Text style={styles.headerSubtitle}>Smart Mini Storage — Đà Nẵng 🏙️</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📦 Đơn hàng gần đây</Text>
        </View>

        {orders.slice(0, 5).map((order) => (
          <View key={order.order_id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>{order.order_id}</Text>
              <Text style={styles.orderStatus}>{order.status}</Text>
            </View>
            <Text style={styles.orderCustomer}>👤 {order.customer_name}</Text>
            <Text style={styles.orderDate}>🕐 {new Date(order.created_at).toLocaleString('vi-VN')}</Text>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, marginTop: 12, gap: 10 },
  statCard: { width: '47%', padding: 16, borderRadius: 12 },
  statTitle: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: 28, fontWeight: 'bold', marginTop: 6 },
  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  orderCard: {
    marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  orderStatus: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
  orderCustomer: { fontSize: 13, color: '#374151', marginTop: 6 },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
});
