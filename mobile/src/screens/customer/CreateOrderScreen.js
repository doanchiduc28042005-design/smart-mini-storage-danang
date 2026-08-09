import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { createMyOrder } from '../../services/api';

const BOX_SIZES = [
  { value: 'S', label: 'S - Nhỏ', desc: '52x36.5x27.5cm', price: '120,000đ/tháng' },
  { value: 'M', label: 'M - Vừa', desc: '62x44.5x32cm', price: '180,000đ/tháng' },
  { value: 'L', label: 'L - Lớn', desc: '69.5x50x36cm', price: '270,000đ/tháng' },
];

export default function CreateOrderScreen({ navigation }) {
  const { user } = useAuth();
  
  const SUGGESTED_DESCS = {
    'S': 'Quần áo, tài liệu, đồ cá nhân nhỏ',
    'M': 'Chăn ga, đồ thể thao, hộp carton vừa',
    'L': 'Vali lớn, chăn bông dày, đồ cồng kềnh'
  };

  const [boxes, setBoxes] = useState([{ size: 'M', item_description: SUGGESTED_DESCS['M'], notes: '' }]);
  const [pickupAddress, setPickupAddress] = useState(user?.default_pickup_address || '');
  const [pickupTime, setPickupTime] = useState('');
  
  const [pickupDateObj, setPickupDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');

  const openPicker = () => {
    setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
    setShowPicker(true);
  };

  const formatAndSet = (d) => {
    const fmt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    setPickupTime(fmt);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setPickupDateObj(selectedDate);
      formatAndSet(selectedDate);
      
      if (Platform.OS === 'android' && pickerMode === 'date' && event.type === 'set') {
        setTimeout(() => {
          setPickerMode('time');
          setShowPicker(true);
        }, 100);
      }
    }
  };
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [distanceKm, setDistanceKm] = useState('3');
  const [floorNumber, setFloorNumber] = useState('0');
  const [hasElevator, setHasElevator] = useState(true);
  const [acceptNoProhibited, setAcceptNoProhibited] = useState(false);
  const [loading, setLoading] = useState(false);

  const addBox = () => {
    setBoxes([...boxes, { size: 'M', item_description: SUGGESTED_DESCS['M'], notes: '' }]);
  };

  const removeBox = (index) => {
    if (boxes.length <= 1) return;
    setBoxes(boxes.filter((_, i) => i !== index));
  };
  const updateBox = (index, field, value) => {
    const updated = [...boxes];
    const currentBox = updated[index];
    
    // Auto-fill description logic
    if (field === 'size') {
      const oldSize = currentBox.size;
      const oldDefaultDesc = SUGGESTED_DESCS[oldSize];
      
      // If desc is empty or untouched from previous auto-fill, replace it
      if (!currentBox.item_description || currentBox.item_description === oldDefaultDesc) {
        currentBox.item_description = SUGGESTED_DESCS[value] || '';
      }
    }
    
    currentBox[field] = value;
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
          <TouchableOpacity
            style={[styles.input, { justifyContent: 'center' }]}
            onPress={openPicker}
          >
            <Text style={{ color: pickupTime ? '#1f2937' : '#9ca3af' }}>
              {pickupTime ? pickupTime : 'Nhấn để chọn ngày giờ lấy hàng...'}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={pickupDateObj}
              mode={pickerMode}
              is24Hour={true}
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
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

          {/* Discount Note */}
          <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginTop: 12, borderColor: '#bbf7d0', borderWidth: 1 }}>
            <Text style={{ fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>🎁 Ưu đãi lưu kho dài hạn:</Text>
            <Text style={{ fontSize: 12, color: '#166534', marginLeft: 8 }}>• Thuê từ 3 tháng: Miễn phí ship chiều gửi</Text>
            <Text style={{ fontSize: 12, color: '#166534', marginLeft: 8 }}>• Thuê từ 6 tháng: Miễn phí ship 2 chiều</Text>
            <Text style={{ fontSize: 11, color: '#15803d', fontStyle: 'italic', marginTop: 4 }}>*Ưu đãi sẽ được áp dụng (hoàn tiền ship) khi quý khách lấy lại hàng.</Text>
          </View>
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
