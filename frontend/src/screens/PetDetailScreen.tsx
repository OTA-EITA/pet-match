import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Pet } from '../types/Pet';
import { petApi } from '../api/petApi';
import { favoriteApi } from '../api/favoriteApi';

type Props = StackScreenProps<RootStackParamList, 'PetDetail'>;

const { width: screenWidth } = Dimensions.get('window');

const PetDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { petId } = route.params;
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fetchPetDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching pet detail for ID: ${petId}`);
      const petData = await petApi.getPet(petId);
      console.log('Pet detail received:', petData);

      setPet(petData);

      // Check if pet is favorited
      const favorited = await favoriteApi.isFavorited(petId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Failed to fetch pet detail:', error);
      setError('ペット情報の取得に失敗しました');
      Alert.alert(
        'エラー',
        'ペット情報の取得に失敗しました。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '再試行', onPress: fetchPetDetail },
          { text: '戻る', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetDetail();
  }, [petId]);

  const handleContactPress = () => {
    console.log('Contact button pressed!');
    Alert.alert(
      'お問い合わせ',
      'お問い合わせ機能は認証システムの実装後に利用可能になります。',
      [{ text: 'OK' }]
    );
  };

  const handleFavoritePress = async () => {
    if (!pet) return;

    try {
      setFavoriteLoading(true);

      if (isFavorited) {
        // Remove from favorites
        await favoriteApi.removeFavorite(pet.id);
        setIsFavorited(false);
        Alert.alert('お気に入り解除', `${pet.name}をお気に入りから削除しました`);
      } else {
        // Add to favorites
        await favoriteApi.addFavorite(pet.id);
        setIsFavorited(true);
        Alert.alert('お気に入り追加', `${pet.name}をお気に入りに追加しました`);
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      const action = isFavorited ? '削除' : '追加';
      Alert.alert('エラー', `お気に入りの${action}に失敗しました`);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const renderImageGallery = () => {
    if (!pet || !pet.images || pet.images.length === 0) {
      return (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderEmoji}>🐾</Text>
          <Text style={styles.imagePlaceholderText}>画像なし</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentImageIndex(index);
          }}
        >
          {pet.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.petImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        {pet.images.length > 1 && (
          <View style={styles.imageIndicator}>
            {pet.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderInfoRow = (icon: string, label: string, value: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const renderPersonalityTags = () => {
    if (!pet?.personality || pet.personality.length === 0) return null;
    
    return (
      <View style={styles.personalityContainer}>
        <Text style={styles.sectionTitle}>性格</Text>
        <View style={styles.tagContainer}>
          {pet.personality.map((trait, index) => (
            <View key={index} style={styles.personalityTag}>
              <Text style={styles.tagText}>{trait}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMedicalInfo = () => {
    if (!pet?.medical_info) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>医療情報</Text>
        <View style={styles.medicalGrid}>
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>ワクチン接種</Text>
            <Text style={[
              styles.medicalStatus,
              pet.medical_info.vaccinated ? styles.statusGood : styles.statusBad
            ]}>
              {pet.medical_info.vaccinated ? '済み' : '未接種'}
            </Text>
          </View>
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>避妊・去勢</Text>
            <Text style={[
              styles.medicalStatus,
              (pet.medical_info.spayed_neutered || pet.medical_info.neutered) ? styles.statusGood : styles.statusBad
            ]}>
              {(pet.medical_info.spayed_neutered || pet.medical_info.neutered) ? '済み' : '未実施'}
            </Text>
          </View>
        </View>
        {((pet.medical_info.health_conditions && pet.medical_info.health_conditions.length > 0) || 
          (pet.medical_info.health_issues && pet.medical_info.health_issues.length > 0)) && (
          <View style={styles.healthConditions}>
            <Text style={styles.medicalLabel}>健康状態</Text>
            {(pet.medical_info.health_conditions || pet.medical_info.health_issues || []).map((condition, index) => (
              <Text key={index} style={styles.conditionText}>• {condition}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>ペット情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😿</Text>
          <Text style={styles.errorText}>ペット情報が見つかりませんでした</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPetDetail}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {renderImageGallery()}
        
        <View style={styles.content}>
          {/* Header with name and favorite */}
          <View style={styles.header}>
            <View style={styles.nameContainer}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.ageText}>{pet.age_info.age_text}</Text>
            </View>
            <TouchableOpacity
              style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]}
              onPress={handleFavoritePress}
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                <ActivityIndicator size="small" color={isFavorited ? '#fff' : '#f44336'} />
              ) : (
                <Text style={styles.favoriteIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            {renderInfoRow('🐕', '種別', pet.species)}
            {renderInfoRow('🏷️', '品種', pet.breed)}
            {renderInfoRow('⚧️', '性別', pet.gender)}
            {renderInfoRow('📏', 'サイズ', pet.size)}
            {renderInfoRow('🎨', '色', pet.color)}
            {renderInfoRow('📍', '所在地', pet.location)}
          </View>

          {/* Personality */}
          {renderPersonalityTags()}

          {/* Medical Info */}
          {renderMedicalInfo()}

          {/* Description */}
          {pet.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>詳細説明</Text>
              <Text style={styles.description}>{pet.description}</Text>
            </View>
          )}

          {/* Contact Button */}
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactPress}
          >
            <Text style={styles.contactButtonText}>📞 お問い合わせ</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  petImage: {
    width: screenWidth,
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: screenWidth,
    height: 300,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  nameContainer: {
    flex: 1,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ageText: {
    fontSize: 18,
    color: '#666',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  favoriteButtonActive: {
    backgroundColor: '#f44336',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
    width: 24,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    minWidth: 60,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  personalityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personalityTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  tagText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  medicalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  medicalItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  medicalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  medicalStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusGood: {
    color: '#4CAF50',
  },
  statusBad: {
    color: '#FF9800',
  },
  healthConditions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  conditionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  contactButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PetDetailScreen;