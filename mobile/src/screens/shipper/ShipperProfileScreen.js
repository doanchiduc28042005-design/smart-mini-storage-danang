import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function ShipperProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
        logout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>👤 Tài khoản Shipper</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileCode}>{user?.shipper_code}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📞</Text>
            <View>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{user?.phone || '(chưa có)'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📧</Text>
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || '(chưa có)'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🪪</Text>
            <View>
              <Text style={styles.infoLabel}>CCCD</Text>
              <Text style={styles.infoValue}>{user?.cccd || '(chưa có)'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📊</Text>
            <View>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <Text style={[styles.infoValue, { color: user?.status === 'active' ? '#10b981' : '#ef4444' }]}>
                {user?.status === 'active' ? '🟢 Đang hoạt động' : '🔴 Không hoạt động'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  profileCard: {
    marginHorizontal: 20, backgroundColor: '#10b981', borderRadius: 16,
    padding: 24, alignItems: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileCode: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  card: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  infoItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111827', marginTop: 2 },
  logoutBtn: {
    marginHorizontal: 20, marginTop: 24, backgroundColor: '#fef2f2',
    paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
});
