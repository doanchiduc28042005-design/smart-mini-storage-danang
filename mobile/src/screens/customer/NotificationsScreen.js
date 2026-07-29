import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, markNotificationRead } from '../../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const onRefresh = () => { setRefreshing(true); loadNotifications(); };

  const handleRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await markNotificationRead(notif.id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>🔔 Thông báo</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount} chưa đọc</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>🔕</Text>
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.is_read && styles.notifUnread]}
              onPress={() => handleRead(notif)}
              activeOpacity={0.7}
            >
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, !notif.is_read && { fontWeight: 'bold' }]}>
                  {notif.title}
                </Text>
                {!notif.is_read && <View style={styles.dot} />}
              </View>
              <Text style={styles.notifMessage}>{notif.message}</Text>
              <Text style={styles.notifDate}>
                {new Date(notif.created_at).toLocaleString('vi-VN')}
              </Text>
            </TouchableOpacity>
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
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  unreadBadge: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12,
    padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
  },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  notifCard: {
    marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  notifUnread: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 15, color: '#111827', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5', marginLeft: 8 },
  notifMessage: { fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 19 },
  notifDate: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
});
