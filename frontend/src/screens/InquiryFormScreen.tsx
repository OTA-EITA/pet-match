import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { inquiryApi } from '../api/inquiryApi';

type Props = StackScreenProps<RootStackParamList, 'InquiryForm'>;

const InquiryFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const { petId } = route.params;
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'question' | 'interview' | 'adoption'>('question');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 10) {
      Alert.alert('エラー', 'メッセージは10文字以上入力してください');
      return;
    }

    if (contactMethod === 'phone' && !phone.trim()) {
      Alert.alert('エラー', '電話番号を入力してください');
      return;
    }

    Alert.alert(
      '確認',
      '問い合わせを送信しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '送信',
          onPress: async () => {
            try {
              setLoading(true);
              await inquiryApi.createInquiry({
                pet_id: petId,
                message: message.trim(),
                type,
                contact_method: contactMethod,
                phone: contactMethod === 'phone' ? phone : undefined,
              });
              Alert.alert('送信完了', '問い合わせを送信しました', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('エラー', error.response?.data?.message || '問い合わせの送信に失敗しました');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>問い合わせ種別</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'question' && styles.typeButtonActive]}
              onPress={() => setType('question')}
            >
              <Text style={[styles.typeButtonText, type === 'question' && styles.typeButtonTextActive]}>
                質問
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'interview' && styles.typeButtonActive]}
              onPress={() => setType('interview')}
            >
              <Text style={[styles.typeButtonText, type === 'interview' && styles.typeButtonTextActive]}>
                面談希望
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'adoption' && styles.typeButtonActive]}
              onPress={() => setType('adoption')}
            >
              <Text style={[styles.typeButtonText, type === 'adoption' && styles.typeButtonTextActive]}>
                譲渡申し込み
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>希望連絡方法</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.typeButton, contactMethod === 'email' && styles.typeButtonActive]}
              onPress={() => setContactMethod('email')}
            >
              <Text style={[styles.typeButtonText, contactMethod === 'email' && styles.typeButtonTextActive]}>
                メール
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, contactMethod === 'phone' && styles.typeButtonActive]}
              onPress={() => setContactMethod('phone')}
            >
              <Text style={[styles.typeButtonText, contactMethod === 'phone' && styles.typeButtonTextActive]}>
                電話
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {contactMethod === 'phone' && (
          <View style={styles.section}>
            <Text style={styles.label}>電話番号 *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="090-1234-5678"
              keyboardType="phone-pad"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>メッセージ *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="問い合わせ内容を入力してください（10文字以上）"
            multiline
            numberOfLines={8}
          />
          <Text style={styles.charCount}>{message.length} / 2000</Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>送信する</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 160,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InquiryFormScreen;
