import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Pet } from '../types/Pet';
import { petApi } from '../api/petApi';
import PetCard from '../components/PetCard';

const PetListScreen: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      console.log('=== Starting API call ===');
      console.log('Fetching pets from API Gateway...');
      const response = await petApi.getPets(20, 0);
      
      console.log('=== API Response received ===');
      console.log('Response object:', response);
      console.log('Pets array:', response.pets);
      console.log('Pets length:', response.pets.length);
      console.log('Total count:', response.total);
      
      console.log(`Fetched ${response.pets.length} pets (total: ${response.total})`);
      setPets(response.pets);
      
      console.log('=== State updated ===');
      console.log('Pets state should now contain:', response.pets);
    } catch (error) {
      console.error('=== API Error ===');
      console.error('Failed to fetch pets:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('ペット情報の取得に失敗しました');
      Alert.alert(
        'エラー',
        'ペット情報の取得に失敗しました。インターネット接続を確認してください。',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('=== API call completed ===');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets(false);
  };

  const onPetPress = (pet: Pet) => {
    Alert.alert(
      pet.name,
      `${pet.breed}\\n${pet.age_info.age_text}\\n\\n${pet.description}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '詳細を見る', onPress: () => console.log('Navigate to detail:', pet.id) }
      ]
    );
  };

  const checkApiHealth = async () => {
    try {
      const health = await petApi.healthCheck();
      console.log('API Gateway Health:', health);
    } catch (error) {
      console.error('API Gateway not accessible:', error);
    }
  };

  useEffect(() => {
    console.log('PetListScreen mounted');
    checkApiHealth();
    fetchPets();
  }, []);

  const renderPetCard = ({ item }: { item: Pet }) => (
    <PetCard pet={item} onPress={onPetPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🐾</Text>
      <Text style={styles.emptyText}>ペットが見つかりませんでした</Text>
      <Text style={styles.emptySubtext}>
        API Gateway (localhost:18081) との接続を確認してください
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>里親募集中のペット</Text>
      <Text style={styles.subtitle}>
        {pets.length > 0 ? `${pets.length}匹の可愛いペットたち` : 'ロード中...'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>ペット情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        contentContainerStyle={pets.length === 0 ? styles.emptyContent : undefined}
        showsVerticalScrollIndicator={false}
      />
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PetListScreen;
