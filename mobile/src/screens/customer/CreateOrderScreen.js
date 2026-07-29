import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { createMyOrder } from '../../services/api';

const BOX_SIZES = [
  { value: 'S', label: 'S - Nhỏ', desc: '40x30x30cm', price: '99,000đ/tháng' },
  { value: 'M', label: 'M - Vừa', desc: '60x40x40cm', price: '149,000đ/tháng' },
  { value: 'L', label: 'L - Lớn', desc: '80x50x50cm', price: '199,000đ/tháng' },
];

export default function CreateOrderScreen({ navigation }) {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState([{ size: 'M', item_description: '', notes: '' }]);
  const [pickupAddress, setPickupAddress] = useState(user?.default_pickup_address || '');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [distanceKm, setDistanceKm] = useState('3');
  const [floorNumber, setFloorNumber] = useState('0');
  const [hasElevator, setHasElevator] = useState(true);
  const [rentalMonths, setRentalMonths] = useState('1');
  const [acceptNoProhibited, setAcceptNoProhibited] = useState(false);
  const [loading, setLoading] = useState(false);

  const addBox = () => {
    setBoxes([...boxes, { size: 'M', item_description: '', notes: '' }]);
  };

  const removeBox = (index) => {
    if (boxes.length <= 1) return;
    setBoxes(boxes.filter((_, i) => i !== index));
  };

  const updateBox = (index, field, value) => {
    const updated = [...boxes];
    updated[index][field] = value;
    setBoxes(updated);
  };

  const handleSubmit = async () => {
    if (!pickupAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ lấy hàng');
      return;
    }
    if (!pickupTime.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập thời gian lấy hàng (VD: 2025-01-15 09:00)');
      return;
    }
    for (const box of boxes) {
      if (!box.item_description.trim()) {
        Alert.alert('Lỗi', 'Vui lòng mô tả hàng hóa cho tất cả các thùng');
        return;
      }
    }
    if (!acceptNoProhibited) {
      Alert.alert('Lỗi', 'Bạn phải xác nhận không gửi hàng cấm');
      return;
    }

    setLoading(true);
    try {
      const data = {
        boxes,
        pickup_address: pickupAddress.trim(),
        pickup_time: new Date(pickupTime).toISOString(),
        delivery_method: deliveryMethod,
        distance_km: parseFloat(distanceKm) || 3,
        floor_number: parseInt(floorNumber) || 0,
        has_elevator: hasElevator,
        rental_months: parseInt(rentalMonths) || 1,
        accept_no_prohibited: true,
      };
      const res = await createMyOrder(data);
      Alert.alert('Thành công! 🎉', res.data.message || 'Đã tạo đơn hàng', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Không thể tạo đơn hàng';
      Alert.alert('Lỗi', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Tạo Đơn Mới</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Boxes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách thùng hàng</Text>
          {boxes.map((box, index) => (
            <View key={index} style={styles.boxCard}>
              <View style={styles.boxHeader}>
                <Text style={styles.boxLabel}>Thùng #{index + 1}</Text>
                {boxes.length > 1 && (
                  <TouchableOpacity onPress={() => removeBox(index)}>
                    <Text style={styles.removeBtn}>❌ Xoá</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Size Selection */}
              <Text style={styles.fieldLabel}>Kích thước</Text>
              <View style={styles.sizeRow}>
                {BOX_SIZES.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.sizeBtn, box.size === s.value && styles.sizeBtnActive]}
                    onPress={() => updateBox(index, 'size', s.value)}
                  >
                    <Text style={[styles.sizeBtnText, box.size === s.value && styles.sizeBtnTextActive]}>
                      {s.label}
                    </Text>
                    <Text style={[styles.sizeDesc, box.size === s.value && { color: '#c7d2fe' }]}>
                      {s.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Mô tả hàng hóa *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Quần áo mùa đông, sách vở..."
                placeholderTextColor="#9ca3af"
                value={box.item_description}
                onChangeText={(v) => updateBox(index, 'item_description', v)}
              />

              <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Hàng dễ vỡ, cần cẩn thận..."
                placeholderTextColor="#9ca3af"
                value={box.notes}
                onChangeText={(v) => updateBox(index, 'notes', v)}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addBoxBtn} onPress={addBox}>
            <Text style={styles.addBoxText}>+ Thêm thùng hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Pickup Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin lấy hàng</Text>

          <Text style={styles.fieldLabel}>Địa chỉ lấy hàng *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập địa chỉ..."
            placeholderTextColor="#9ca3af"
            value={pickupAddress}
            onChangeText={setPickupAddress}
          />

          <Text style={styles.fieldLabel}>Thời gian lấy hàng *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2025-01-15 09:00"
            placeholderTextColor="#9ca3af"
            value={pickupTime}
            onChangeText={setPickupTime}
          />
        </View>

        {/* Shipping Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức giao nhận</Text>

          <View style={styles.deliveryRow}>
            <TouchableOpacity
              style={[styles.deliveryBtn, deliveryMethod === 'standard' && styles.deliveryBtnActive]}
              onPress={() => setDeliveryMethod('standard')}
            >
              <Text style={styles.deliveryIcon}>🚚</Text>
              <Text style={[styles.deliveryText, deliveryMethod === 'standard' && styles.deliveryTextActive]}>
                Giao tận nơi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deliveryBtn, deliveryMethod === 'self_pickup' && styles.deliveryBtnActive]}
              onPress={() => setDeliveryMethod('self_pickup')}
            >
              <Text style={styles.deliveryIcon}>🏪</Text>
              <Text style={[styles.deliveryText, deliveryMethod === 'self_pickup' && styles.deliveryTextActive]}>
                Tự mang đến
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryMethod === 'standard' && (
            <>
              <Text style={styles.fieldLabel}>Khoảng cách (km)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={distanceKm}
                onChangeText={setDistanceKm}
              />

              <Text style={styles.fieldLabel}>Tầng</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={floorNumber}
                onChangeText={setFloorNumber}
              />

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Có thang máy?</Text>
                <Switch value={hasElevator} onValueChange={setHasElevator} trackColor={{ true: '#4f46e5' }} />
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Số tháng thuê</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={rentalMonths}
            onChangeText={setRentalMonths}
          />
        </View>

        {/* Confirm */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={[styles.fieldLabel, { flex: 1 }]}>
              ✅ Tôi xác nhận không gửi hàng cấm, chất nguy hiểm
            </Text>
            <Switch value={acceptNoProhibited} onValueChange={setAcceptNoProhibited} trackColor={{ true: '#4f46e5' }} />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!acceptNoProhibited || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!acceptNoProhibited || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>📤 Gửi Đơn Hàng</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { color: '#4f46e5', fontWeight: '600', fontSize: 15, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  scroll: { flex: 1 },
  section: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  boxCard: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  boxLabel: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5' },
  removeBtn: { fontSize: 13, color: '#ef4444' },
  sizeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  sizeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#fff' },
  sizeBtnActive: { borderColor: '#4f46e5', backgroundColor: '#4f46e5' },
  sizeBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  sizeBtnTextActive: { color: '#ffffff' },
  sizeDesc: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  addBoxBtn: { paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4f46e5', borderStyle: 'dashed', alignItems: 'center', marginTop: 8 },
  addBoxText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
  deliveryRow: { flexDirection: 'row', gap: 10 },
  deliveryBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#fff' },
  deliveryBtnActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  deliveryIcon: { fontSize: 24, marginBottom: 4 },
  deliveryText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  deliveryTextActive: { color: '#4f46e5' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
