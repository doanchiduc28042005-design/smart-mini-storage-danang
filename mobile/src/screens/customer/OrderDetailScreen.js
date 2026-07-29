import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { getOrder, getOrderTrackingHistory } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy Hàng', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy Hàng', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Đang Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'DELIVERED': { label: '✅ Đã Giao', color: '#10b981', bg: '#d1fae5' },
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderRes, trackRes] = await Promise.allSettled([
        getOrder(orderId),
        getOrderTrackingHistory(orderId),
      ]);
      if (orderRes.status === 'fulfilled') setOrder(orderRes.value.data);
      if (trackRes.status === 'fulfilled') setTracking(trackRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 40 }}>❌</Text>
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const st = statusLabels[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status & Order ID */}
        <View style={styles.statusCard}>
          <Text style={styles.orderIdLarge}>{order.order_id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* QR Code */}
        {order.qr_code_data && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Mã QR</Text>
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: order.qr_code_data }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Danh sách thùng hàng ({order.items?.length || 0})</Text>
          {(order.items || []).map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeText}>{item.size}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDesc}>{item.item_description}</Text>
                {item.notes && <Text style={styles.itemNotes}>📝 {item.notes}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Pickup Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Thông tin lấy hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{order.pickup_address || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian:</Text>
            <Text style={styles.infoValue}>
              {order.pickup_time ? new Date(order.pickup_time).toLocaleString('vi-VN') : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tạo bởi:</Text>
            <Text style={styles.infoValue}>{order.created_by === 'customer' ? 'Khách hàng' : 'Admin'}</Text>
          </View>
        </View>

        {/* Shipping Fee */}
        {order.shipping_fee_details && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚚 Phí Ship</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phương thức:</Text>
              <Text style={styles.infoValue}>
                {order.delivery_method === 'self_pickup' ? 'Tự mang đến trạm' : 'Giao tận nơi'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phí lượt gửi:</Text>
              <Text style={styles.infoValue}>{(order.shipping_fee_details.outbound_fee || 0).toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phí lượt trả:</Text>
              <Text style={styles.infoValue}>{(order.shipping_fee_details.return_fee || 0).toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TỔNG PHÍ SHIP:</Text>
              <Text style={styles.totalValue}>{(order.shipping_fee || 0).toLocaleString('vi-VN')}đ</Text>
            </View>
            {order.shipping_fee_details.notes && order.shipping_fee_details.notes.length > 0 && (
              <View style={styles.notesBox}>
                {order.shipping_fee_details.notes.map((note, i) => (
                  <Text key={i} style={styles.noteText}>• {note}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tracking History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Lịch sử tracking</Text>
          {tracking.length === 0 ? (
            <Text style={styles.emptyTracking}>Chưa có lịch sử tracking</Text>
          ) : (
            tracking.map((t, idx) => (
              <View key={idx} style={styles.trackingItem}>
                <View style={styles.trackingDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackingStatus}>
                    {statusLabels[t.status]?.label || t.status}
                  </Text>
                  <Text style={styles.trackingMeta}>
                    👤 {t.shipper_name} • {new Date(t.timestamp).toLocaleString('vi-VN')}
                  </Text>
                  {t.notes && <Text style={styles.trackingNotes}>📝 {t.notes}</Text>}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  backLink: { color: '#4f46e5', fontWeight: '600', fontSize: 15, marginTop: 16 },
  headerBar: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { color: '#4f46e5', fontWeight: '600', fontSize: 15, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  scroll: { flex: 1 },
  statusCard: {
    marginHorizontal: 20, marginTop: 8, backgroundColor: '#fff', borderRadius: 12,
    padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
  },
  orderIdLarge: { fontSize: 20, fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  card: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  qrContainer: { alignItems: 'center', paddingVertical: 8 },
  qrImage: { width: 180, height: 180 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sizeBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sizeText: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5' },
  itemDesc: { fontSize: 14, color: '#374151' },
  itemNotes: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5' },
  notesBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginTop: 8 },
  noteText: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  emptyTracking: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },
  trackingItem: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  trackingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4f46e5', marginTop: 4 },
  trackingStatus: { fontSize: 14, fontWeight: '600', color: '#111827' },
  trackingMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  trackingNotes: { fontSize: 12, color: '#374151', marginTop: 4 },
});
