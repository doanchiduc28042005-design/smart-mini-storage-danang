import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../services/api';

export default function AdminEmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({ employee_code: '', name: '', email: '', phone: '', address: '', role: 'Nhân Viên' });

  const loadEmployees = useCallback(async () => {
    try {
      const { data } = await getEmployees();
      setEmployees(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  const onRefresh = () => { setRefreshing(true); loadEmployees(); };

  const openCreate = () => {
    setEditingEmployee(null);
    setForm({ employee_code: '', name: '', email: '', phone: '', address: '', role: 'Nhân Viên' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({ employee_code: emp.employee_code, name: emp.name, email: emp.email, phone: emp.phone, address: emp.address, role: emp.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.employee_code || !form.phone) {
      Alert.alert('Lỗi', 'Vui lòng điền mã NV, tên và SĐT');
      return;
    }
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, form);
        Alert.alert('Thành công', 'Đã cập nhật nhân viên');
      } else {
        await createEmployee(form);
        Alert.alert('Thành công', 'Đã thêm nhân viên mới');
      }
      setShowModal(false);
      loadEmployees();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể lưu');
    }
  };

  const handleDelete = (emp) => {
    Alert.alert('Xóa nhân viên', `Xóa ${emp.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await deleteEmployee(emp.id);
            Alert.alert('Đã xóa');
            loadEmployees();
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa nhân viên');
          }
        }
      },
    ]);
  };

  const ROLES = ['Admin', 'Quản Lý', 'Nhân Viên'];

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>👔 Nhân viên ({employees.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}
        showsVerticalScrollIndicator={false}
      >
        {employees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36 }}>👔</Text>
            <Text style={styles.emptyText}>Chưa có nhân viên</Text>
          </View>
        ) : (
          employees.map(emp => (
            <View key={emp.id} style={styles.empCard}>
              <View style={styles.empHeader}>
                <View>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empCode}>{emp.employee_code} • {emp.role}</Text>
                </View>
                <View style={styles.empActions}>
                  <TouchableOpacity onPress={() => openEdit(emp)}>
                    <Text style={styles.editBtn}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(emp)}>
                    <Text style={styles.deleteBtn}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.empInfo}>📞 {emp.phone}</Text>
              <Text style={styles.empInfo}>📧 {emp.email}</Text>
              {emp.address && <Text style={styles.empInfo}>📍 {emp.address}</Text>}
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEmployee ? '✏️ Sửa nhân viên' : '➕ Thêm nhân viên'}
            </Text>

            <Text style={styles.fieldLabel}>Mã nhân viên *</Text>
            <TextInput style={styles.input} value={form.employee_code} onChangeText={v => setForm({...form, employee_code: v})} placeholder="VD: NV001" placeholderTextColor="#9ca3af" />

            <Text style={styles.fieldLabel}>Họ tên *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="Nguyễn Văn A" placeholderTextColor="#9ca3af" />

            <Text style={styles.fieldLabel}>SĐT *</Text>
            <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm({...form, phone: v})} placeholder="0901234567" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={v => setForm({...form, email: v})} placeholder="email@example.com" placeholderTextColor="#9ca3af" />

            <Text style={styles.fieldLabel}>Địa chỉ</Text>
            <TextInput style={styles.input} value={form.address} onChangeText={v => setForm({...form, address: v})} placeholder="Đà Nẵng" placeholderTextColor="#9ca3af" />

            <Text style={styles.fieldLabel}>Vai trò</Text>
            <View style={styles.roleRow}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                  onPress={() => setForm({...form, role: r})}
                >
                  <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  empCard: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  empHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  empName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  empCode: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  empActions: { flexDirection: 'row', gap: 12 },
  editBtn: { fontSize: 20 },
  deleteBtn: { fontSize: 20 },
  empInfo: { fontSize: 13, color: '#6b7280', marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  roleBtnActive: { borderColor: '#7c3aed', backgroundColor: '#7c3aed' },
  roleText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  roleTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#7c3aed', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
