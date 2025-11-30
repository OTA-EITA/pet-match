import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { favoriteApi, Favorite } from '../api/favoriteApi';
import { petApi } from '../api/petApi';
import { Pet } from '../types/Pet';
import PetCard from '../components/PetCard';
import AdBanner from '../components/AdBanner';

type Props = StackScreenProps<RootStackParamList, 'Favorites'>;

interface FavoritePetData {
  favorite: Favorite;
  pet: Pet | null;
}

const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const [favoritePets, setFavoritePets] = useState<FavoritePetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setError(null);
      const response = await favoriteApi.getFavorites(1, 50);

      // Fetch pet details for each favorite
      const favoritePetDataPromises = response.favorites.map(async (favorite) => {
        try {
          const pet = await petApi.getPet(favorite.pet_id);
          return { favorite, pet };
        } catch (error) {
          console.error(`Failed to fetch pet ${favorite.pet_id}:`, error);
          return { favorite, pet: null };
        }
      });

      const favoritePetData = await Promise.all(favoritePetDataPromises);
      setFavoritePets(favoritePetData);
    } catch (error: any) {
      console.error('Failed to load favorites:', error);
      setError(error.response?.data?.message || 'お気に入りの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (petId: string, petName: string) => {
    Alert.alert(
      'お気に入り解除',
      `${petName}をお気に入りから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoriteApi.removeFavorite(petId);
              // Remove from local state
              setFavoritePets((prev) =>
                prev.filter((item) => item.favorite.pet_id !== petId)
              );
            } catch (error: any) {
              console.error('Failed to remove favorite:', error);
              Alert.alert('エラー', 'お気に入りの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handlePetPress = (petId: string) => {
    navigation.navigate('PetDetail', { petId });
  };

  const renderPetCard = ({ item }: { item: FavoritePetData }) => {
    if (!item.pet) {
      return (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>この猫の情報を読み込めませんでした</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item.favorite.pet_id, '不明')}
          >
            <Text style={styles.removeButtonText}>削除</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity onPress={() => handlePetPress(item.pet!.id)}>
          <PetCard pet={item.pet} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleRemoveFavorite(item.pet!.id, item.pet!.name)}
        >
          <Text style={styles.favoriteIcon}>❤️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💔</Text>
      <Text style={styles.emptyTitle}>お気に入りがありません</Text>
      <Text style={styles.emptyText}>
        気になる猫を見つけたら、ハートボタンでお気に入りに追加しましょう
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('PetList')}
      >
        <Text style={styles.browseButtonText}>猫を探す</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && favoritePets.length === 0) {
    // 401エラーの場合はログインが必要なことを明示
    const isAuthError = error.includes('401') || error.includes('ログイン') || error.includes('認証');

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          {isAuthError ? (
            <>
              <Text style={styles.loginRequiredIcon}>🔐</Text>
              <Text style={styles.loginRequiredTitle}>ログインが必要です</Text>
              <Text style={styles.loginRequiredMessage}>
                お気に入り機能を使用するにはログインしてください
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonText}>ログインする</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.errorTitle}>エラーが発生しました</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadFavorites}>
                <Text style={styles.retryButtonText}>再試行</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>お気に入り</Text>
        <Text style={styles.count}>{favoritePets.length}件</Text>
      </View>

      {/* Top Ad Banner */}
      <AdBanner />

      <FlatList
        data={favoritePets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item.favorite.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Bottom Ad Banner */}
      <View style={styles.bottomAdContainer}>
        <AdBanner />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  count: {
    fontSize: 16,
    color: '#666',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  removeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginRequiredIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  loginRequiredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loginRequiredMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomAdContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
});

export default FavoritesScreen;
