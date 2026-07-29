import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getShippers, approveShipper, rejectShipper } from '../../services/api';

const REG_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
  { key: 'active', label: 'Đang HĐ' },
];

export default function AdminShippersScreen() {
  const [shippers, setShippers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShippers = useCallback(async () => {
    try {
      const { data } = await getShippers();
      setShippers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadShippers(); }, [loadShippers]);
  const onRefresh = () => { setRefreshing(true); loadShippers(); };

  const handleApprove = (shipper) => {
    Alert.alert('Duyệt Shipper', `Duyệt hồ sơ ${shipper.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt', onPress: async () => {
          try {
            await approveShipper(shipper.id);
            Alert.alert('Thành công', 'Đã duyệt shipper!');
            loadShippers();
          } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể duyệt');
          }
        }
      },
    ]);
  };

  const handleReject = (shipper) => {
    Alert.prompt && Alert.prompt('Từ chối', 'Nhập lý do từ chối:', async (reason) => {
      if (!reason) return;
      try {
        await rejectShipper(shipper.id, { reason });
        Alert.alert('Đã từ chối');
        loadShippers();
      } catch (e) {
        Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể từ chối');
      }
    });
    // Fallback for platforms without Alert.prompt
    if (!Alert.prompt) {
      Alert.alert('Từ chối Shipper', `Từ chối hồ sơ ${shipper.name}?`, [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối', style: 'destructive', onPress: async () => {
            try {
              await rejectShipper(shipper.id, { reason: 'Hồ sơ không đạt yêu cầu' });
              Alert.alert('Đã từ chối');
              loadShippers();
            } catch (e) {
              Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể từ chối');
            }
          }
        },
      ]);
    }
  };

  const filteredShippers = shippers.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return s.registration_status === 'approved' && s.has_password;
    return s.registration_status === activeTab;
  });

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>🚚 Quản lý Shipper</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {REG_TABS.map(tab => {
          const count = tab.key === 'all' ? shippers.length 
            : tab.key === 'active' ? shippers.filter(s => s.registration_status === 'approved' && s.has_password).length
            : shippers.filter(s => s.registration_status === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredShippers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>👤</Text>
            <Text style={styles.emptyText}>Không có shipper nào</Text>
          </View>
        ) : (
          filteredShippers.map(shipper => {
            const regColor = shipper.registration_status === 'approved' ? '#10b981' 
              : shipper.registration_status === 'rejected' ? '#ef4444' : '#f59e0b';
            const regLabel = shipper.registration_status === 'approved' ? 'Đã duyệt'
              : shipper.registration_status === 'rejected' ? 'Từ chối' : 'Chờ duyệt';
            return (
              <View key={shipper.id} style={styles.shipperCard}>
                <View style={styles.shipperHeader}>
                  <View>
                    <Text style={styles.shipperName}>{shipper.name}</Text>
                    <Text style={styles.shipperCode}>{shipper.shipper_code || '(chưa có mã)'}</Text>
                  </View>
                  <View style={[styles.regBadge, { backgroundColor: `${regColor}20` }]}>
                    <Text style={[styles.regBadgeText, { color: regColor }]}>{regLabel}</Text>
                  </View>
                </View>
                <Text style={styles.shipperInfo}>📞 {shipper.phone}</Text>
                <Text style={styles.shipperInfo}>📧 {shipper.email}</Text>
                <Text style={styles.shipperInfo}>🪪 {shipper.cccd}</Text>
                {shipper.has_password && (
                  <Text style={[styles.shipperInfo, { color: '#10b981' }]}>✅ Đã đăng ký tài khoản</Text>
                )}
                {shipper.registration_status === 'rejected' && shipper.rejection_reason && (
                  <Text style={[styles.shipperInfo, { color: '#ef4444' }]}>❌ {shipper.rejection_reason}</Text>
                )}

                {shipper.registration_status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(shipper)}>
                      <Text style={styles.approveBtnText}>✅ Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(shipper)}>
                      <Text style={styles.rejectBtnText}>❌ Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  tabScroll: { maxHeight: 44, marginBottom: 8 },
  tabContent: { paddingHorizontal: 16, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  emptyCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  shipperCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  shipperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  shipperName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  shipperCode: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  regBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  regBadgeText: { fontSize: 12, fontWeight: '600' },
  shipperInfo: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: { flex: 1, backgroundColor: '#ecfdf5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d0' },
  approveBtnText: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#fef2f2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  rejectBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
});
