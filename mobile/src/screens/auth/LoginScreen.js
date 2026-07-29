import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi, shipperLogin } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState('customer'); // 'customer' or 'shipper'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      console.log('[LOGIN] roleTab:', roleTab, '| phone:', phone);
      let response;
      if (roleTab === 'shipper') {
        console.log('[LOGIN] Calling shipperLogin with shipper_code:', phone);
        response = await shipperLogin({ shipper_code: phone, password });
      } else {
        console.log('[LOGIN] Calling loginApi with identifier:', phone);
        response = await loginApi({ identifier: phone, password });
      }
      
      console.log('[LOGIN] Response data:', JSON.stringify(response.data));
      
      const access_token = response.data.token || response.data.access_token;
      const user = response.data.user || response.data.shipper;
      
      console.log('[LOGIN] Token:', access_token ? 'OK' : 'MISSING');
      console.log('[LOGIN] User:', JSON.stringify(user));
      
      if (!access_token || !user) {
        Alert.alert('Lỗi', 'Không nhận được token hoặc thông tin user từ server');
        return;
      }
      
      if (roleTab === 'shipper' && user.role !== 'shipper') {
        Alert.alert('Lỗi', 'Tài khoản này không phải là Đối tác Shipper!');
        return;
      }
      
      await login(access_token, user);
      console.log('[LOGIN] Login context updated successfully');
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      console.error('[LOGIN] Error response:', error.response?.data);
      let msg = 'Đã có lỗi xảy ra';
      if (!error.response) {
        msg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend đang chạy trên localhost:8000';
      } else if (typeof error.response.data?.detail === 'string') {
        msg = error.response.data.detail;
      } else if (Array.isArray(error.response.data?.detail)) {
        msg = error.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
      } else {
        msg = 'Sai thông tin đăng nhập hoặc lỗi server';
      }
      Alert.alert('Đăng nhập thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Chào mừng bạn trở lại với SmartBox</Text>

        {/* Role Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, roleTab === 'customer' && styles.tabActive]}
            onPress={() => setRoleTab('customer')}
          >
            <Text style={[styles.tabText, roleTab === 'customer' && styles.tabTextActive]}>Khách / Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, roleTab === 'shipper' && styles.tabActive]}
            onPress={() => setRoleTab('shipper')}
          >
            <Text style={[styles.tabText, roleTab === 'shipper' && styles.tabTextActive]}>Shipper</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{roleTab === 'shipper' ? 'Mã Shipper (SPxxxx)' : 'Số điện thoại / Email'}</Text>
            <TextInput 
              style={styles.input}
              placeholder={roleTab === 'shipper' ? 'Ví dụ: SP0001' : '0912345678'}
              placeholderTextColor="#9ca3af"
              keyboardType={roleTab === 'shipper' ? 'default' : 'email-address'}
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput 
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
            <Text style={styles.submitButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 24,
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
    marginBottom: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontWeight: '600',
    color: '#6b7280',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#4f46e5',
  },
  formGroup: {
    gap: 18,
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
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 15,
  },
  linkText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
