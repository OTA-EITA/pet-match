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
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { petApi, PetCreateRequest } from '../api/petApi';
import AdBanner from '../components/AdBanner';

type Props = StackScreenProps<RootStackParamList, 'PetRegister'>;

type Gender = 'male' | 'female';

interface PetFormData {
  name: string;
  breed: string;
  age: string;
  gender: Gender;
  weight: string; // 体重 (kg)
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
    weight: '',
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
    if (Platform.OS === 'web') {
      window.alert('準備中\n画像アップロード機能は準備中です');
    } else {
      Alert.alert('準備中', '画像アップロード機能は準備中です');
    }
  };

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const submitPet = async () => {
    try {
      setLoading(true);

      // Convert age from months to years/months
      const ageInMonths = parseInt(formData.age, 10) || 0;
      const ageYears = Math.floor(ageInMonths / 12);
      const ageMonths = ageInMonths % 12;

      // Parse personality as array
      const personality = formData.personality
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Parse weight
      const weight = parseFloat(formData.weight) || undefined;

      const createRequest: PetCreateRequest = {
        name: formData.name.trim(),
        species: 'cat',
        breed: formData.breed.trim(),
        age_years: ageYears,
        age_months: ageMonths,
        is_age_estimated: true,
        gender: formData.gender,
        weight: weight,
        personality: personality.length > 0 ? personality : undefined,
        description: formData.description.trim(),
        images: images.length > 0 ? images : undefined,
      };

      await petApi.createPet(createRequest);

      showAlert('登録完了', '猫ちゃんを登録しました', () => navigation.goBack());
    } catch (error: any) {
      console.error('Failed to create pet:', error);
      showAlert('エラー', error.response?.data?.error || '猫ちゃんの登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showAlert('エラー', '名前を入力してください');
      return;
    }
    if (!formData.breed.trim()) {
      showAlert('エラー', '品種を入力してください');
      return;
    }
    if (!formData.age.trim()) {
      showAlert('エラー', '年齢を入力してください');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      showAlert('エラー', '説明は20文字以上入力してください');
      return;
    }

    // Web では window.confirm を使用
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('猫ちゃんを登録しますか？');
      if (confirmed) {
        await submitPet();
      }
    } else {
      // iOS/Android では Alert.alert を使用
      Alert.alert(
        '確認',
        '猫ちゃんを登録しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '登録', onPress: submitPet },
        ]
      );
    }
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

          <Text style={styles.label}>名前 <Text style={styles.required}>*必須</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="ミケ"
          />

          <Text style={styles.label}>品種 <Text style={styles.required}>*必須</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.breed}
            onChangeText={(v) => updateField('breed', v)}
            placeholder="ミックス / アメリカンショートヘア など"
          />

          <Text style={styles.label}>年齢（月齢） <Text style={styles.required}>*必須</Text></Text>
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

          <Text style={styles.label}>体重 (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(v) => updateField('weight', v)}
            placeholder="4.5"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細情報</Text>

          <Text style={styles.label}>説明 <Text style={styles.required}>*必須（20文字以上）</Text></Text>
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
  required: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: 'bold',
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
