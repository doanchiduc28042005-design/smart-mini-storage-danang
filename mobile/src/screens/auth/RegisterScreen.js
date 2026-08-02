import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { registerCustomer as registerCustomerApi, registerShipper as registerShipperApi } from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [tab, setTab] = useState('customer'); // 'customer' | 'shipper'
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '', // customer only
    password: '', // customer only
    confirmPassword: '', // customer only
    cccd: '', // shipper only
    license_photo: null, // shipper only
  });
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để tải ảnh lên!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setForm({ ...form, license_photo: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleRegister = async () => {
    // Chung
    if (!form.name || !form.phone || (tab === 'shipper' && !form.email)) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    if (tab === 'customer') {
      if (!form.password) {
        Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
        return;
      }
      if (form.password !== form.confirmPassword) {
        Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
        return;
      }
    } else if (tab === 'shipper') {
      if (!form.cccd || !form.license_photo) {
        Alert.alert('Lỗi', 'Vui lòng nhập CCCD và tải ảnh Bằng lái xe');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'customer') {
        await registerCustomerApi({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          password: form.password
        });
        
        Alert.alert('Thành công', 'Đăng ký tài khoản Khách hàng thành công! Vui lòng đăng nhập.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        await registerShipperApi({
          name: form.name,
          phone: form.phone,
          email: form.email,
          cccd: form.cccd,
          license_photo: form.license_photo,
        });
        
        Alert.alert('Thành công', 'Đăng ký Đối tác giao hàng thành công! Vui lòng chờ Email thông báo duyệt từ Quản trị viên.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Đăng ký thất bại';
      Alert.alert('Lỗi', typeof msg === 'string' ? msg : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Quay lại Đăng nhập</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Đăng ký</Text>
        <Text style={styles.subtitle}>Tạo tài khoản sử dụng SmartBox</Text>

        {/* Custom Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, tab === 'customer' && styles.tabButtonActive]}
            onPress={() => setTab('customer')}
          >
            <Text style={[styles.tabText, tab === 'customer' && styles.tabTextActive]}>Khách hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, tab === 'shipper' && styles.tabButtonActive]}
            onPress={() => setTab('shipper')}
          >
            <Text style={[styles.tabText, tab === 'shipper' && styles.tabTextActive]}>Đối tác (Shipper)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput 
              style={styles.input}
              placeholder="Nguyễn Văn A"
              placeholderTextColor="#9ca3af"
              value={form.name}
              onChangeText={(text) => setForm({...form, name: text})}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput 
              style={styles.input}
              placeholder="0912345678"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({...form, phone: text})}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email {tab === 'shipper' ? '*' : ''}</Text>
            <TextInput 
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({...form, email: text})}
            />
          </View>

          {/* CUSTOMER ONLY FIELDS */}
          {tab === 'customer' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Địa chỉ mặc định</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Số nhà, Tên đường, Đà Nẵng"
                  placeholderTextColor="#9ca3af"
                  value={form.address}
                  onChangeText={(text) => setForm({...form, address: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(text) => setForm({...form, password: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Xác nhận mật khẩu *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={form.confirmPassword}
                  onChangeText={(text) => setForm({...form, confirmPassword: text})}
                />
              </View>
            </>
          )}

          {/* SHIPPER ONLY FIELDS */}
          {tab === 'shipper' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Số CCCD/CMND *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0123456789"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={form.cccd}
                  onChangeText={(text) => setForm({...form, cccd: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ảnh Giấy phép lái xe *</Text>
                <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
                  {form.license_photo ? (
                    <Image source={{ uri: form.license_photo }} style={styles.uploadedImage} />
                  ) : (
                    <Text style={styles.imageUploadText}>📸 Chọn ảnh từ thư viện</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={styles.shipperNote}>* Shipper sau khi được duyệt sẽ nhận được Email hướng dẫn tạo mật khẩu.</Text>
            </>
          )}

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
            <Text style={styles.submitButtonText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#4f46e5',
  },
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  imageUploadBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageUploadText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  shipperNote: {
    fontSize: 13,
    color: '#f59e0b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
