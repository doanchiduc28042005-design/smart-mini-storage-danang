import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatWithAI } from '../../services/api';

export default function AiChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: 'Chào bạn! Mình là trợ lý AI của Smart Mini Storage. Mình có thể giúp gì cho bạn về giá cả, kích thước thùng, hoặc quy trình lưu kho?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    inputRef.current?.clear();
    
    const newUserMsg = { id: Date.now().toString(), role: 'user', text: userText };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Format messages for the backend (excluding the first welcome message if we want, or keep it as context)
      // The backend expects: { messages: [{ role: "user", content: "..." }] }
      const apiMessages = updatedMessages
        .filter(m => m.id !== '1') // Skip the local welcome message
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.text }));

      const { data } = await chatWithAI(apiMessages);
      const aiResponse = { id: (Date.now() + 1).toString(), role: 'ai', text: data.reply || '...' };
      setMessages(prev => [...prev, aiResponse]);
    } catch (e) {
      const errorMsg = { id: (Date.now() + 1).toString(), role: 'ai', text: 'Xin lỗi, có lỗi kết nối đến máy chủ. Vui lòng thử lại sau.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, loading]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Trợ lý ảo Smart AI 🤖</Text>
          <Text style={styles.headerSubtitle}>Sẵn sàng giải đáp 24/7</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>
                {msg.text}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble, { width: 60 }]}>
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#9ca3af"
            value={Platform.OS === 'ios' ? input : undefined}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            autoCorrect={false}
            spellCheck={false}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8, marginRight: 8 },
  backIcon: { fontSize: 24, color: '#1e293b' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#10b981', marginTop: 2 },
  keyboardView: { flex: 1 },
  chatArea: { flex: 1, backgroundColor: '#f8fafc' },
  chatContent: { padding: 16, gap: 12 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#1e293b' },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#1e293b',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
  sendIcon: { color: '#fff', fontSize: 18, marginLeft: -2 },
});
