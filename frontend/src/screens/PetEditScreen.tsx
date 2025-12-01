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
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { petApi, PetUpdateRequest } from '../api/petApi';
import AdBanner from '../components/AdBanner';

type Props = StackScreenProps<RootStackParamList, 'PetEdit'>;

type Gender = 'male' | 'female';
type Size = 'small' | 'medium' | 'large';
type Status = 'available' | 'pending' | 'adopted';

interface PetFormData {
  name: string;
  breed: string;
  age: string;
  gender: Gender;
  size: Size;
  status: Status;
  description: string;
  medical_history: string;
  personality: string;
  requirements: string;
}

const PetEditScreen: React.FC<Props> = ({ route, navigation }) => {
  const { petId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    breed: '',
    age: '',
    gender: 'male',
    size: 'medium',
    status: 'available',
    description: '',
    medical_history: '',
    personality: '',
    requirements: '',
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    loadPetData();
  }, [petId]);

  const loadPetData = async () => {
    try {
      const pet = await petApi.getPet(petId);

      // Convert age_info to months for display
      const ageInMonths = pet.age_info
        ? pet.age_info.years * 12 + pet.age_info.months
        : 0;

      setFormData({
        name: pet.name,
        breed: pet.breed,
        age: String(ageInMonths),
        gender: pet.gender,
        size: pet.size,
        status: pet.status,
        description: pet.description || '',
        medical_history: pet.medical_info?.health_issues?.join(', ') || '',
        personality: pet.personality?.join(', ') || '',
        requirements: '',
      });
      setImages(pet.images || []);
    } catch (error) {
      console.error('Failed to load pet data:', error);
      Alert.alert('エラー', '猫ちゃん情報の取得に失敗しました');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof PetFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    Alert.alert('準備中', '画像アップロード機能は準備中です');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }
    if (!formData.breed.trim()) {
      Alert.alert('エラー', '品種を入力してください');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      Alert.alert('エラー', '説明は20文字以上入力してください');
      return;
    }

    Alert.alert(
      '確認',
      '変更を保存しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '保存',
          onPress: async () => {
            try {
              setSaving(true);

              // Convert age from months to years/months
              const ageInMonths = parseInt(formData.age, 10) || 0;
              const ageYears = Math.floor(ageInMonths / 12);
              const ageMonths = ageInMonths % 12;

              // Parse personality as array
              const personality = formData.personality
                .split(/[,、]/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

              const updateRequest: PetUpdateRequest = {
                name: formData.name.trim(),
                breed: formData.breed.trim(),
                age_years: ageYears,
                age_months: ageMonths,
                gender: formData.gender,
                size: formData.size,
                status: formData.status,
                personality: personality.length > 0 ? personality : undefined,
                description: formData.description.trim(),
                images: images.length > 0 ? images : undefined,
              };

              await petApi.updatePet(petId, updateRequest);

              Alert.alert('保存完了', '変更を保存しました', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              console.error('Failed to update pet:', error);
              Alert.alert('エラー', error.response?.data?.error || '保存に失敗しました');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdBanner />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>写真</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
              <Text style={styles.addImageIcon}>+</Text>
              <Text style={styles.addImageText}>写真を追加</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>募集ステータス</Text>
          <View style={styles.statusGroup}>
            {(['available', 'pending', 'adopted'] as Status[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  formData.status === status && styles.statusButtonActive,
                  formData.status === status && {
                    backgroundColor:
                      status === 'available' ? '#4CAF50' :
                      status === 'pending' ? '#FF9800' : '#9E9E9E',
                  },
                ]}
                onPress={() => updateField('status', status)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    formData.status === status && styles.statusButtonTextActive,
                  ]}
                >
                  {status === 'available' ? '募集中' : status === 'pending' ? '交渉中' : '譲渡済み'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

          <Text style={styles.label}>年齢（月齢）</Text>
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>変更を保存</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  statusGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetEditScreen;
