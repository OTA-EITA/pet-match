import React, { useState, useEffect } from 'react';
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
import { authApi } from '../api/authApi';

type Props = StackScreenProps<RootStackParamList, 'ProfileEdit'>;

const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await authApi.getProfile();
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    } catch (error) {
      Alert.alert('エラー', 'プロフィール情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }

    try {
      setSaving(true);
      await authApi.updateProfile({ name, phone, address });
      Alert.alert('成功', 'プロフィールを更新しました', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('エラー', error.response?.data?.message || 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('エラー', 'すべてのパスワード欄を入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('エラー', '新しいパスワードが一致しません');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上である必要があります');
      return;
    }

    try {
      setSaving(true);
      await authApi.updatePassword({ current_password: currentPassword, new_password: newPassword });
      Alert.alert('成功', 'パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('エラー', error.response?.data?.message || 'パスワードの変更に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          <Text style={styles.label}>名前 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="山田 太郎"
          />

          <Text style={styles.label}>電話番号</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="090-1234-5678"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>住所</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="東京都渋谷区..."
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.button} onPress={handleSaveProfile} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>プロフィールを保存</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>パスワード変更</Text>

          <Text style={styles.label}>現在のパスワード</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="********"
            secureTextEntry
          />

          <Text style={styles.label}>新しいパスワード</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="********"
            secureTextEntry
          />

          <Text style={styles.label}>新しいパスワード（確認）</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="********"
            secureTextEntry
          />

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleChangePassword} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#2196F3" />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>パスワードを変更</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
});

export default ProfileEditScreen;
