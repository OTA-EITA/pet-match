import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Pet } from '../types/Pet';

interface PetCardProps {
  pet: Pet;
  onPress: (pet: Pet) => void;
  compact?: boolean; // グリッド表示用のコンパクトモード
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2カラム用

const PetCard: React.FC<PetCardProps> = ({ pet, onPress, compact = false }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const hasImage = pet.images && pet.images.length > 0 && !imageError;

  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? '♂' : '♀';
  };

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? '#4A90D9' : '#E75480';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#FF8C00';
      case 'pending': return '#FFB347';
      case 'adopted': return '#A0A0A0';
      default: return '#FF8C00';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '募集中';
      case 'pending': return '交渉中';
      case 'adopted': return '決定';
      default: return status;
    }
  };

  if (compact) {
    // コンパクト表示（2カラムグリッド用）
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => onPress(pet)}
        activeOpacity={0.8}
      >
        <View style={styles.compactImageContainer}>
          {hasImage ? (
            <>
              <Image
                source={{ uri: pet.images[0] }}
                style={styles.compactImage}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                resizeMode="cover"
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FF8C00" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.compactPlaceholder}>
              <Text style={styles.compactPlaceholderEmoji}>🐱</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pet.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(pet.status)}</Text>
          </View>
        </View>

        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactName} numberOfLines={1}>{pet.name}</Text>
            <Text style={[styles.compactGender, { color: getGenderColor(pet.gender) }]}>
              {getGenderIcon(pet.gender)}
            </Text>
          </View>
          <Text style={styles.compactBreed} numberOfLines={1}>{pet.breed}</Text>
          <Text style={styles.compactAge}>{pet.age_info.age_text}</Text>
          {pet.weight && pet.weight > 0 && (
            <Text style={styles.compactWeight}>{pet.weight}kg</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // 通常表示（リスト用）
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(pet)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {hasImage ? (
          <>
            <Image
              source={{ uri: pet.images[0] }}
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              resizeMode="cover"
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#FF8C00" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>🐱</Text>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
        <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(pet.status) }]}>
          <Text style={styles.statusBadgeLargeText}>{getStatusText(pet.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{pet.name}</Text>
          <View style={[styles.genderBadge, { backgroundColor: getGenderColor(pet.gender) + '20' }]}>
            <Text style={[styles.genderText, { color: getGenderColor(pet.gender) }]}>
              {getGenderIcon(pet.gender)} {pet.gender === 'male' ? 'オス' : 'メス'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>品種</Text>
            <Text style={styles.infoValue}>{pet.breed}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>年齢</Text>
            <Text style={styles.infoValue}>{pet.age_info.age_text}</Text>
          </View>
          {pet.weight && pet.weight > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>体重</Text>
              <Text style={styles.infoValue}>{pet.weight}kg</Text>
            </View>
          )}
        </View>

        {pet.personality && pet.personality.length > 0 && (
          <View style={styles.personalityContainer}>
            {pet.personality.slice(0, 3).map((trait, index) => (
              <View key={index} style={styles.personalityTag}>
                <Text style={styles.personalityText}>{trait}</Text>
              </View>
            ))}
          </View>
        )}

        {pet.description && (
          <Text style={styles.description} numberOfLines={2}>
            {pet.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.medicalInfo}>
            <View style={[styles.medicalBadge, pet.medical_info?.vaccinated && styles.medicalBadgeActive]}>
              <Text style={[styles.medicalText, pet.medical_info?.vaccinated && styles.medicalTextActive]}>
                ワクチン{pet.medical_info?.vaccinated ? '済' : '未'}
              </Text>
            </View>
            <View style={[styles.medicalBadge, (pet.medical_info?.neutered) && styles.medicalBadgeActive]}>
              <Text style={[styles.medicalText, (pet.medical_info?.neutered) && styles.medicalTextActive]}>
                避妊去勢{(pet.medical_info?.neutered) ? '済' : '未'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // コンパクトカード（グリッド用）
  compactCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  compactImageContainer: {
    width: '100%',
    height: cardWidth,
    backgroundColor: '#FFF5E6',
    position: 'relative',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
  },
  compactPlaceholderEmoji: {
    fontSize: 48,
  },
  compactContent: {
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  compactGender: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  compactBreed: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  compactAge: {
    fontSize: 12,
    color: '#888',
  },
  compactWeight: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },

  // ステータスバッジ
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadgeLarge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeLargeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // 画像ローディング
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 230, 0.7)',
  },

  // 通常カード（リスト用）
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFF5E6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  genderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    minWidth: 60,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  personalityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  personalityTag: {
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  personalityText: {
    fontSize: 12,
    color: '#D97706',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  medicalInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  medicalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  medicalBadgeActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  medicalText: {
    fontSize: 11,
    color: '#999',
  },
  medicalTextActive: {
    color: '#388E3C',
  },
});

export default PetCard;
