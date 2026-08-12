import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { getOrder, getOrderTrackingHistory } from '../../services/api';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy Hàng', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy Hàng', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Đang Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'WAITING_FOR_RETURN': { label: '⏳ Chờ Trả Hàng', color: '#c2410c', bg: '#ffedd5' },
  'RETURNING': { label: '🚚 Đang Trả', color: '#0f766e', bg: '#ccfbf1' },
  'RETURNED': { label: '✅ Đã Trả', color: '#10b981', bg: '#d1fae5' },
};

const LiveCountdown = ({ startDateStr, durationDays }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [elapsedText, setElapsedText] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startDateStr);
      const now = new Date();
      const elapsedMs = now.getTime() - start.getTime();
      const elapsedDays = Math.floor(elapsedMs / (1000 * 3600 * 24));
      setElapsedText(`Thực tế lưu kho: ${elapsedDays} ngày`);

      if (durationDays > 0) {
        const end = new Date(start.getTime() + durationDays * 24 * 3600 * 1000);
        const remainingMs = end.getTime() - now.getTime();
        
        if (remainingMs <= 0) {
          setIsExpired(true);
          setTimeLeft(formatTime(Math.abs(remainingMs)));
        } else {
          setIsExpired(false);
          setTimeLeft(formatTime(remainingMs));
        }
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [startDateStr, durationDays]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / (3600 * 24));
    
    let result = '';
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const remDays = days % 30;
      result += `${months} tháng `;
      if (remDays > 0) result += `${remDays} ngày `;
    } else if (days > 0) {
      result += `${days} ngày `;
    }
    
    result += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return result;
  };

  if (durationDays > 0) {
    if (isExpired) {
      return (
        <View>
          <Text style={{ fontSize: 13, color: '#374151' }}>{elapsedText}</Text>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#dc2626', marginTop: 4 }}>⚠️ Quá hạn: {timeLeft}</Text>
        </View>
      );
    }
    return (
      <View>
        <Text style={{ fontSize: 13, color: '#374151' }}>{elapsedText}</Text>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16a34a', marginTop: 4 }}>⏱️ Còn lại: {timeLeft}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>{elapsedText}</Text>
    </View>
  );
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

        {/* Dynamic Status Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Thông báo hệ thống</Text>
          {order.status === 'WAITING_FOR_PICKUP' && (
            <View style={[styles.alertBox, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <Text style={styles.alertIcon}>⏳</Text>
              <Text style={[styles.alertText, { color: '#92400e' }]}>Đơn hàng đã được ghi nhận. Đang điều phối Shipper đến lấy hàng.</Text>
            </View>
          )}
          {order.status === 'PICKED_UP' && (
            <View style={[styles.alertBox, { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
              <Text style={styles.alertIcon}>🚚</Text>
              <Text style={[styles.alertText, { color: '#1e40af' }]}>Shipper đã lấy hàng thành công và đang đưa về kho Hub.</Text>
            </View>
          )}
          {order.status === 'WAITING_FOR_RETURN' && (
            <View style={[styles.alertBox, { backgroundColor: '#ffedd5', borderColor: '#fed7aa' }]}>
              <Text style={styles.alertIcon}>📦</Text>
              <Text style={[styles.alertText, { color: '#9a3412' }]}>Yêu cầu trả hàng đã tiếp nhận. Chờ Shipper điều phối.</Text>
            </View>
          )}
          {order.status === 'RETURNING' && (
            <View style={[styles.alertBox, { backgroundColor: '#ccfbf1', borderColor: '#99f6e4' }]}>
              <Text style={styles.alertIcon}>🚚</Text>
              <Text style={[styles.alertText, { color: '#115e59' }]}>Shipper đang đi trả hàng. Vui lòng chú ý điện thoại.</Text>
            </View>
          )}
          {order.status === 'RETURNED' && (
            <View style={[styles.alertBox, { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }]}>
              <Text style={styles.alertIcon}>✅</Text>
              <Text style={[styles.alertText, { color: '#065f46' }]}>Đơn hàng đã trả thành công. Cảm ơn bạn!</Text>
            </View>
          )}
          
          {(order.duration_days > 0 || order.hub_arrival_date || order.status === 'IN_HUB') && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
              <Text style={{ fontWeight: 'bold', color: '#4f46e5', marginBottom: 4 }}>⏳ Thông tin lưu kho:</Text>
              {order.duration_days > 0 && (
                <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  Thời gian thuê: {order.duration_days >= 30 && order.duration_days % 30 === 0 ? `${order.duration_days / 30} tháng` : `${order.duration_days} ngày`}
                </Text>
              )}
              {(order.hub_arrival_date || order.status === 'IN_HUB') ? (
                <LiveCountdown 
                  startDateStr={order.hub_arrival_date || order.last_updated || order.created_at} 
                  durationDays={order.duration_days} 
                />
              ) : (
                <Text style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>Chưa nhập kho</Text>
              )}
            </View>
          )}
        </View>

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
  alertBox: { flexDirection: 'row', padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'flex-start', gap: 8 },
  alertIcon: { fontSize: 18 },
  alertText: { fontSize: 13, flex: 1, lineHeight: 18, fontWeight: '500' }
});
