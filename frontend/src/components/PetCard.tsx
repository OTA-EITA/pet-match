import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Pet } from '../types/Pet';

interface PetCardProps {
  pet: Pet;
  onPress: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onPress }) => {
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
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.emoji}>{getSpeciesEmoji(pet.species)}</Text>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.gender}>{getGenderEmoji(pet.gender)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pet.status) }]}>
          <Text style={styles.statusText}>{getStatusText(pet.status)}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.breed}>{pet.breed}</Text>
        <Text style={styles.age}>{pet.age_info.age_text}</Text>
        <Text style={styles.color}>毛色: {pet.color}</Text>
      </View>

      {pet.personality.length > 0 && (
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
          ⚕️ {pet.medical_info.neutered ? '去勢・避妊済' : '未手術'}
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
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
  },
  medical: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  medicalText: {
    fontSize: 12,
    color: '#4CAF50',
  },
});

export default PetCard;
