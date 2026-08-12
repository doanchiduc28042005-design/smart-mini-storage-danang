import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getShipperOrders, updateOrderLocation, scanQR } from '../../services/api';
import * as Location from 'expo-location';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: '#f59e0b', bg: '#fef3c7' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: '#3b82f6', bg: '#dbeafe' },
  'IN_HUB': { label: '🏢 Ở Hub', color: '#8b5cf6', bg: '#ede9fe' },
  'WAITING_FOR_RETURN': { label: '⏳ Chờ Trả Hàng', color: '#c2410c', bg: '#ffedd5' },
  'RETURNING': { label: '🚚 Đang Trả', color: '#0f766e', bg: '#ccfbf1' },
  'RETURNED': { label: '✅ Đã Trả', color: '#10b981', bg: '#d1fae5' },
};

const STATUS_OPTIONS = [
  { value: 'PICKED_UP', label: '🚚 Đã Lấy Hàng' },
  { value: 'IN_HUB', label: '🏢 Đã Về Hub/Kho' },
  { value: 'WAITING_FOR_RETURN', label: '⏳ Đã Nhập Hub, Chờ Trả Khách' },
  { value: 'RETURNING', label: '🚚 Đang Đi Trả Khách' },
  { value: 'RETURNED', label: '✅ Đã Giao Cho Khách' },
];

export default function ShipperHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(null);
  
  // Status update states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const handleUpdateLocation = async (orderId) => {
    setUpdatingLocation(orderId);
    try {
      let location;
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      
      if (!servicesEnabled) {
        // Fallback to mock location if GPS is disabled (useful for Emulator)
        location = { coords: { latitude: 16.0544, longitude: 108.2022 } }; // Da Nang center
        Alert.alert('Chế độ Máy ảo', 'GPS đang tắt. Tự động dùng tọa độ ảo (Đà Nẵng) để test!');
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập vị trí để cập nhật tọa độ!');
          setUpdatingLocation(null);
          return;
        }

        try {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch (locErr) {
          // If it still fails, use mock location
          location = { coords: { latitude: 16.0544, longitude: 108.2022 } };
          Alert.alert('Chế độ Máy ảo', 'Không lấy được vị trí thật. Đã tự động dùng tọa độ ảo (Đà Nẵng) để test!');
        }
      }

      await updateOrderLocation(orderId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      Alert.alert('Thành công', 'Đã cập nhật vị trí cho đơn hàng này.');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật vị trí: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUpdatingLocation(null);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setUpdateNotes('');
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await scanQR({
        order_id: selectedOrder.order_id,
        shipper_id: user.id,
        status: newStatus,
        notes: updateNotes.trim() || undefined,
      });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng!');
      setSelectedOrder(null);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'RETURNED');
  const completedOrders = orders.filter(o => o.status === 'RETURNED');

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
                
                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#10b981', flex: 1 }]}
                    onPress={() => openStatusModal(order)}
                  >
                    <Text style={styles.actionBtnText}>🔄 Trạng thái</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#3b82f6', flex: 1 }]}
                    onPress={() => handleUpdateLocation(order.order_id)}
                    disabled={updatingLocation === order.order_id}
                  >
                    {updatingLocation === order.order_id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionBtnText}>📍 Vị trí</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Update Status Modal */}
      <Modal visible={!!selectedOrder} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật đơn {selectedOrder?.order_id}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusOption, newStatus === opt.value && styles.statusOptionActive]}
                  onPress={() => setNewStatus(opt.value)}
                >
                  <Text style={[styles.statusOptionText, newStatus === opt.value && styles.statusOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.notesInput}
              placeholder="Ghi chú thêm..."
              placeholderTextColor="#9ca3af"
              value={updateNotes}
              onChangeText={setUpdateNotes}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#f3f4f6', flex: 1 }]} onPress={() => setSelectedOrder(null)}>
                <Text style={[styles.modalBtnText, { color: '#4b5563' }]}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#10b981', flex: 1 }, (!newStatus || updatingStatus) && { opacity: 0.5 }]} 
                onPress={handleUpdateStatus}
                disabled={!newStatus || updatingStatus}
              >
                {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  statusOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  statusOptionActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  statusOptionText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  statusOptionTextActive: { color: '#10b981' },
  notesInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, minHeight: 60, marginTop: 8, textAlignVertical: 'top' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { fontWeight: 'bold', fontSize: 14 }
});
