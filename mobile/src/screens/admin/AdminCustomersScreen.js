import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCustomers } from '../../services/api';

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const { data } = await getCustomers();
      setCustomers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  const onRefresh = () => { setRefreshing(true); loadCustomers(); };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>👥 Khách hàng ({customers.length})</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}
        showsVerticalScrollIndicator={false}
      >
        {customers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>👤</Text>
            <Text style={styles.emptyText}>Chưa có khách hàng</Text>
          </View>
        ) : (
          customers.map(c => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.customerName}>{c.name}</Text>
              <Text style={styles.customerInfo}>📞 {c.phone}</Text>
              {c.email && <Text style={styles.customerInfo}>📧 {c.email}</Text>}
              {c.address && <Text style={styles.customerInfo}>📍 {c.address}</Text>}
              <Text style={styles.customerInfo}>
                {c.has_account ? '✅ Có tài khoản' : '⏳ Chưa đăng ký'}
              </Text>
            </View>
          ))
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
  emptyCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  card: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  customerInfo: { fontSize: 13, color: '#6b7280', marginTop: 4 },
});
