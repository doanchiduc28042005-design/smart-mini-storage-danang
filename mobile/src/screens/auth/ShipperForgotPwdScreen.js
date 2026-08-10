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
      const response = await forgotShipperPassword({ email });
      const { shipper } = response.data;
      const setupLink = `https://doanchiduc28042005-design.github.io/smart-mini-storage-danang/?redirect=/shipper/setup-password`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2e6c80; text-align: center;">Smart Mini Storage</h2>
          <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 20px;">
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu tài khoản Shipper của bạn tại <strong>Smart Mini Storage</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border: 1px dashed #ccc;">
            <p style="margin: 0; font-size: 16px;">Mã Shipper của bạn là:</p>
            <strong style="font-size: 24px; color: #d9534f; display: block; margin-top: 5px;">${shipper.shipper_code}</strong>
          </div>

          <p>Vui lòng nhấp vào nút bên dưới để thiết lập lại mật khẩu mới:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupLink}" style="display: inline-block; padding: 12px 25px; background-color: #d9534f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Khôi phục mật khẩu</a>
          </div>
          
          <p style="color: #777; font-size: 14px;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
          <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ Smart Mini Storage</strong></p>
        </div>
      `;

      const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://doanchiduc28042005-design.github.io'
        },
        body: JSON.stringify({
          service_id: 'service_sggjbk5',
          template_id: 'template_5wjogpj',
          user_id: 'r-S0Sjfnd2vqq8hil',
          template_params: {
            to_email: shipper.email,
            subject: 'Yêu cầu khôi phục mật khẩu Shipper Smart Mini Storage',
            message: htmlContent,
          }
        })
      });

      if (!emailRes.ok) {
        throw new Error('Không thể gửi email. Hãy thử lại.');
      }

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
                autoCorrect={false}
                spellCheck={false}
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
