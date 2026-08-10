import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { TERMS_TITLE, TERMS_SECTIONS, TERMS_WARNING } from '../../constants/terms';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều Khoản Dịch Vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>📜 Điều Khoản Dịch Vụ</Text>
          <Text style={styles.subTitle}>{TERMS_TITLE}</Text>
          <Text style={styles.miniText}>Smart Mini Storage • Đà Nẵng</Text>
        </View>

        {TERMS_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.intro ? <Text style={styles.sectionIntro}>{section.intro}</Text> : null}
            
            <View style={styles.pointsContainer}>
              {section.points.map((point, pidx) => (
                <View key={pidx} style={styles.pointCard}>
                  <Text style={styles.pointHeading}>{point.heading}:</Text>
                  <Text style={styles.pointBody}>{point.body}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Cảnh Báo Quan Trọng</Text>
          <Text style={styles.warningText}>"{TERMS_WARNING}"</Text>
        </View>

        <TouchableOpacity style={styles.acceptBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.acceptBtnText}>Tôi Đã Hiểu & Đồng Ý</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  miniText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingLeft: 12,
    marginBottom: 12,
  },
  sectionIntro: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 12,
    lineHeight: 22,
  },
  pointsContainer: {
    gap: 12,
  },
  pointCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pointHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  pointBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fca5a5',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f1d1d',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  acceptBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
