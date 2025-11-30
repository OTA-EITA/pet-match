import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Pet } from '../types/Pet';

interface PetCardProps {
  pet: Pet;
  onPress: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const hasImage = pet.images && pet.images.length > 0 && !imageError;

  const getSpeciesEmoji = (species: string) => {
    switch (species.toLowerCase()) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      default: return '🐾';
    }
  };

  const getGenderEmoji = (gender: string) => {
    return gender === 'male' ? '♂️' : '♀️';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'adopted': return '#757575';
      default: return '#2196F3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '里親募集中';
      case 'pending': return '検討中';
      case 'adopted': return '決定済み';
      default: return status;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(pet)}
      activeOpacity={0.7}
    >
      {/* ペット画像 */}
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
              <View style={styles.imageLoading}>
                <ActivityIndicator size="small" color="#2196F3" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>{getSpeciesEmoji(pet.species)}</Text>
            <Text style={styles.placeholderText}>画像なし</Text>
          </View>
        )}
        {/* ステータスバッジ（画像の上に配置） */}
        <View style={[styles.statusBadgeOverlay, { backgroundColor: getStatusColor(pet.status) }]}>
          <Text style={styles.statusText}>{getStatusText(pet.status)}</Text>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.emoji}>{getSpeciesEmoji(pet.species)}</Text>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.gender}>{getGenderEmoji(pet.gender)}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.breed}>{pet.breed}</Text>
        <Text style={styles.age}>{pet.age_info.age_text}</Text>
        {pet.color && <Text style={styles.color}>毛色: {pet.color}</Text>}
      </View>

      {pet.personality && pet.personality.length > 0 && (
        <View style={styles.personality}>
          <Text style={styles.personalityLabel}>性格:</Text>
          {pet.personality.slice(0, 2).map((trait, index) => (
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

      <View style={styles.medical}>
        <Text style={styles.medicalText}>
          💉 {pet.medical_info.vaccinated ? 'ワクチン済' : '未接種'}
        </Text>
        <Text style={styles.medicalText}>
          ⚕️ {(pet.medical_info.spayed_neutered || pet.medical_info.neutered) ? '去勢・避妊済' : '未手術'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  header: {
    padding: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  gender: {
    fontSize: 16,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  breed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  age: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  color: {
    fontSize: 14,
    color: '#666',
  },
  personality: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  personalityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  personalityTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  personalityText: {
    fontSize: 12,
    color: '#1976D2',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  medical: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  medicalText: {
    fontSize: 12,
    color: '#4CAF50',
  },
});

export default PetCard;
