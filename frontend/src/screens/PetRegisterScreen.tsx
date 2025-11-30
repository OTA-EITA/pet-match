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
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import AdBanner from '../components/AdBanner';

type Props = StackScreenProps<RootStackParamList, 'PetRegister'>;

type Gender = 'male' | 'female';
type Size = 'small' | 'medium' | 'large';

interface PetFormData {
  name: string;
  breed: string;
  age: string;
  gender: Gender;
  size: Size;
  description: string;
  medical_history: string;
  personality: string;
  requirements: string;
}

const PetRegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    breed: '',
    age: '',
    gender: 'male',
    size: 'medium',
    description: '',
    medical_history: '',
    personality: '',
    requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const updateField = (field: keyof PetFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    // TODO: Implement image picker
    Alert.alert('準備中', '画像アップロード機能は準備中です');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }
    if (!formData.breed.trim()) {
      Alert.alert('エラー', '品種を入力してください');
      return;
    }
    if (!formData.age.trim()) {
      Alert.alert('エラー', '年齢を入力してください');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      Alert.alert('エラー', '説明は20文字以上入力してください');
      return;
    }

    Alert.alert(
      '確認',
      'ペットを登録しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '登録',
          onPress: async () => {
            try {
              setLoading(true);
              // TODO: Call API to register pet
              // await petApi.registerPet(formData);

              // Mock success for now
              await new Promise((resolve) => setTimeout(resolve, 1000));

              Alert.alert('登録完了', 'ペットを登録しました', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('エラー', error.response?.data?.message || 'ペットの登録に失敗しました');
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
      <AdBanner />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>写真</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.imagePreview} />
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
              <Text style={styles.addImageIcon}>+</Text>
              <Text style={styles.addImageText}>写真を追加</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          <Text style={styles.label}>名前 *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="ミケ"
          />

          <Text style={styles.label}>品種 *</Text>
          <TextInput
            style={styles.input}
            value={formData.breed}
            onChangeText={(v) => updateField('breed', v)}
            placeholder="ミックス / アメリカンショートヘア など"
          />

          <Text style={styles.label}>年齢（月齢） *</Text>
          <TextInput
            style={styles.input}
            value={formData.age}
            onChangeText={(v) => updateField('age', v)}
            placeholder="12"
            keyboardType="numeric"
          />

          <Text style={styles.label}>性別</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'male' && styles.genderButtonActive]}
              onPress={() => updateField('gender', 'male')}
            >
              <Text style={[styles.genderButtonText, formData.gender === 'male' && styles.genderButtonTextActive]}>
                オス ♂
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'female' && styles.genderButtonActive]}
              onPress={() => updateField('gender', 'female')}
            >
              <Text style={[styles.genderButtonText, formData.gender === 'female' && styles.genderButtonTextActive]}>
                メス ♀
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>サイズ</Text>
          <View style={styles.buttonGroup}>
            {(['small', 'medium', 'large'] as Size[]).map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeButton, formData.size === size && styles.sizeButtonActive]}
                onPress={() => updateField('size', size)}
              >
                <Text style={[styles.sizeButtonText, formData.size === size && styles.sizeButtonTextActive]}>
                  {size === 'small' ? '小型' : size === 'medium' ? '中型' : '大型'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細情報</Text>

          <Text style={styles.label}>説明 *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(v) => updateField('description', v)}
            placeholder="この猫についての説明を入力してください（20文字以上）"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.charCount}>{formData.description.length} / 2000</Text>

          <Text style={styles.label}>性格</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.personality}
            onChangeText={(v) => updateField('personality', v)}
            placeholder="人懐っこい、おとなしい、活発 など"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>医療履歴</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.medical_history}
            onChangeText={(v) => updateField('medical_history', v)}
            placeholder="ワクチン接種済み、去勢済み など"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>譲渡条件</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.requirements}
            onChangeText={(v) => updateField('requirements', v)}
            placeholder="室内飼い必須、単頭飼い希望 など"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>登録する</Text>
          )}
        </TouchableOpacity>

        <AdBanner />
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addImageIcon: {
    fontSize: 32,
    color: '#999',
  },
  addImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
  },
  genderButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sizeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetRegisterScreen;
