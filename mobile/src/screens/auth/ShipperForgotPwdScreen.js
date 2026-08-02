import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotShipperPassword } from '../../services/api';

export default function ShipperForgotPwdScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleForgotPwd = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    try {
      await forgotShipperPassword({ email });
      setSuccess(true);
    } catch (error) {
      let msg = error.response?.data?.detail || 'Không tìm thấy tài khoản hoặc lỗi server';
      Alert.alert('Lỗi', msg);
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

        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>
          {success 
            ? 'Yêu cầu thành công! Chúng tôi đã gửi liên kết khôi phục mật khẩu đến email của bạn.' 
            : 'Nhập email của bạn để nhận liên kết khôi phục'}
        </Text>

        {!success && (
          <View style={styles.formGroup}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Địa chỉ Email *</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ví dụ: nguyenvan@gmail.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleForgotPwd}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
              <Text style={styles.submitButtonText}>Gửi Yêu Cầu</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {success && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.submitButtonText}>Về Đăng nhập</Text>
          </TouchableOpacity>
        )}
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
    lineHeight: 22,
  },
  formGroup: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
