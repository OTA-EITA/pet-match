import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

type Props = StackScreenProps<RootStackParamList, 'Signup'>;

type UserType = 'adopter' | 'shelter';

interface UserTypeOption {
  value: UserType;
  label: string;
  description: string;
}

const USER_TYPE_OPTIONS: UserTypeOption[] = [
  { value: 'adopter', label: '一般ユーザー', description: '猫を探す・里親を募集する' },
  { value: 'shelter', label: 'シェルター', description: '保護施設・団体の方' },
];

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('adopter');

  const handleSignup = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        type: userType,
      });
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      console.error('Signup error:', error);
      const responseData = error.response?.data;
      let message = '登録に失敗しました';

      // Check for duplicate email error
      if (responseData?.details?.includes('already exists') ||
          responseData?.message?.includes('already exists')) {
        message = 'このメールアドレスは既に登録されています。ログインしてください。';
        Alert.alert(
          '登録済みのアカウント',
          message,
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: 'ログインへ', onPress: () => navigation.navigate('Login') }
          ]
        );
        return;
      }

      // Check for password validation error
      if (responseData?.details?.includes('password') ||
          responseData?.message?.includes('password')) {
        message = 'パスワードは8文字以上で、大文字・小文字・数字・特殊文字を含む必要があります';
      } else if (responseData?.message) {
        message = responseData.message;
      }

      Alert.alert('登録エラー', message);
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>← 戻る</Text>
              </TouchableOpacity>
              <Text style={styles.title}>新規登録</Text>
              <Text style={styles.subtitle}>アカウントを作成して猫ちゃんと出会おう</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* User Type Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>登録タイプ</Text>
                <View style={styles.userTypeContainer}>
                  {USER_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.userTypeOption,
                        userType === option.value && styles.userTypeOptionSelected,
                      ]}
                      onPress={() => setUserType(option.value)}
                      disabled={isLoading}
                    >
                      <Text
                        style={[
                          styles.userTypeLabel,
                          userType === option.value && styles.userTypeLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.userTypeDescription,
                          userType === option.value && styles.userTypeDescriptionSelected,
                        ]}
                      >
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>名前</Text>
                <TextInput
                  style={styles.input}
                  placeholder="山田太郎"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>メールアドレス</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>パスワード</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6文字以上"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>パスワード（確認）</Text>
                <TextInput
                  style={styles.input}
                  placeholder="もう一度入力してください"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signupButtonText}>登録する</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>すでにアカウントをお持ちですか？</Text>
                <TouchableOpacity onPress={handleLoginPress} disabled={isLoading}>
                  <Text style={styles.loginLink}>ログイン</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF8C00',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  userTypeOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FFD9B3',
    alignItems: 'center',
  },
  userTypeOptionSelected: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF5E6',
  },
  userTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userTypeLabelSelected: {
    color: '#FF8C00',
  },
  userTypeDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  userTypeDescriptionSelected: {
    color: '#D97706',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  signupButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  loginLink: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
});

export default SignupScreen;
