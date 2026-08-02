import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getOrder, scanQR } from '../../services/api';
import { CameraView, useCameraPermissions } from 'expo-camera';

const STATUS_OPTIONS = [
  { value: 'PICKED_UP', label: '🚚 Đã Lấy Hàng' },
  { value: 'IN_HUB', label: '🏢 Đã Về Hub/Kho' },
  { value: 'DELIVERED', label: '✅ Đã Giao Cho Khách' },
];

export default function ShipperScanScreen() {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Camera states
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);

  const handleLookup = async (idToLookup) => {
    const id = typeof idToLookup === 'string' ? idToLookup : orderId;
    if (!id.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã đơn hàng');
      return;
    }
    setLoading(true);
    try {
      const res = await getOrder(id.trim());
      setOrderInfo(res.data);
      setOrderId(id.trim());
    } catch (e) {
      Alert.alert('Lỗi', 'Không tìm thấy đơn hàng với mã này');
      setOrderInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    setShowScanner(false);
    if (data) {
      setOrderId(data);
      handleLookup(data);
    }
  };

  const openScanner = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Thông báo', 'Chức năng quét mã QR bằng Camera chỉ hoạt động trên ứng dụng di động thật (điện thoại). Trên máy tính, vui lòng nhập mã bằng tay nhé!');
      return;
    }

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Lỗi', 'Bạn cần cấp quyền sử dụng camera để quét QR');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleSubmit = async () => {
    if (!status) {
      Alert.alert('Lỗi', 'Vui lòng chọn trạng thái mới');
      return;
    }
    setSubmitting(true);
    try {
      await scanQR({
        order_id: orderInfo.order_id,
        shipper_id: user.id,
        status,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Thành công! ✅', 'Đã cập nhật trạng thái đơn hàng');
      setOrderInfo(null);
      setOrderId('');
      setStatus('');
      setNotes('');
    } catch (e) {
      const msg = e.response?.data?.detail || 'Lỗi cập nhật trạng thái';
      Alert.alert('Lỗi', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>📷 Quét / Nhập Mã Đơn</Text>
        </View>

        {/* Manual Input or QR Button */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nhập mã hoặc quét QR</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="VD: ORD-ABC12345"
              placeholderTextColor="#9ca3af"
              value={orderId}
              onChangeText={setOrderId}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.lookupBtn} onPress={() => handleLookup()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={styles.lookupBtnText}>Tìm</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.qrButton} onPress={openScanner}>
            <Text style={styles.qrButtonText}>📸 Quét Mã QR</Text>
          </TouchableOpacity>
        </View>

        {/* Order Info */}
        {orderInfo && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📦 Thông tin đơn hàng</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã đơn:</Text>
                <Text style={styles.infoValue}>{orderInfo.order_id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Khách hàng:</Text>
                <Text style={styles.infoValue}>{orderInfo.customer_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trạng thái hiện tại:</Text>
                <Text style={[styles.infoValue, { fontWeight: 'bold', color: '#4f46e5' }]}>
                  {orderInfo.status}
                </Text>
              </View>
              {orderInfo.pickup_address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={styles.infoValue}>{orderInfo.pickup_address}</Text>
                </View>
              )}
              {orderInfo.items && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.infoLabel}>Hàng hóa:</Text>
                  {orderInfo.items.map((item, idx) => (
                    <Text key={idx} style={styles.itemText}>
                      • [{item.size}] {item.item_description}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Update Status */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔄 Cập nhật trạng thái</Text>

              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusOption, status === opt.value && styles.statusOptionActive]}
                  onPress={() => setStatus(opt.value)}
                >
                  <Text style={[styles.statusOptionText, status === opt.value && styles.statusOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.input, { minHeight: 60 }]}
                placeholder="Ghi chú thêm..."
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!status || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!status || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>📤 Xác nhận cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Text style={styles.scannerCloseText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Đưa mã QR vào khung hình</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={{ flex: 1 }}>
            {showScanner && (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  card: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  lookupBtn: {
    backgroundColor: '#10b981', paddingHorizontal: 20, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  lookupBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  qrButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },
  itemText: { fontSize: 13, color: '#374151', marginTop: 4, marginLeft: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  statusOption: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8, backgroundColor: '#fff',
  },
  statusOptionActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  statusOptionText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  statusOptionTextActive: { color: '#10b981' },
  submitBtn: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111827'
  },
  scannerCloseText: {
    color: '#fff',
    fontSize: 16,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
