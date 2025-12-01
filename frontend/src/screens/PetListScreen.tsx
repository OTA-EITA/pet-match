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
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Pet } from '../types/Pet';
import { petApi, PetSearchParams } from '../api/petApi';
import PetCard from '../components/PetCard';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import AdBanner from '../components/AdBanner';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;

type Props = StackScreenProps<RootStackParamList, 'PetList'>;

const PetListScreen: React.FC<Props> = ({ navigation }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  const fetchPets = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Build search parameters from filters
      const searchParams: PetSearchParams = {
        limit: 20,
        offset: 0,
        species: 'cat', // OnlyCatsなので猫のみ
      };

      // Apply gender filter
      if (filters.gender) {
        searchParams.gender = filters.gender;
      }

      // Apply size filter
      if (filters.size) {
        searchParams.size = filters.size;
      }

      // Apply age range filter
      if (filters.ageRange) {
        switch (filters.ageRange) {
          case 'kitten':
            searchParams.age_min = 0;
            searchParams.age_max = 12; // 0-1歳（月単位）
            break;
          case 'young':
            searchParams.age_min = 12;
            searchParams.age_max = 36; // 1-3歳
            break;
          case 'adult':
            searchParams.age_min = 36;
            searchParams.age_max = 84; // 3-7歳
            break;
          case 'senior':
            searchParams.age_min = 84; // 7歳以上
            break;
        }
      }

      // Apply breed filter
      if (filters.breed) {
        searchParams.breed = filters.breed;
      }

      console.log('Fetching pets with filters:', searchParams);
      const response = await petApi.getPets(searchParams);

      console.log(`Fetched ${response.pets.length} pets (total: ${response.total})`);
      setPets(response.pets);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      setError('猫ちゃん情報の取得に失敗しました');
      Alert.alert(
        'エラー',
        '猫ちゃん情報の取得に失敗しました。インターネット接続を確認してください。',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets(false);
  };

  const onPetPress = (pet: Pet) => {
    // Navigate to pet detail screen
    navigation.navigate('PetDetail', { petId: pet.id });
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
  }, [filters]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setShowFilterModal(false);
  };

  const removeFilter = (filterKey: keyof FilterOptions) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    setFilters(newFilters);
  };

  const getFilterLabel = (key: keyof FilterOptions, value: string): string => {
    switch (key) {
      case 'gender':
        return value === 'male' ? 'オス' : 'メス';
      case 'size':
        return value === 'small' ? '小型' : value === 'medium' ? '中型' : '大型';
      case 'ageRange':
        return value === 'kitten' ? '子猫' : value === 'young' ? '若猫' : value === 'adult' ? '成猫' : 'シニア';
      case 'breed':
        return value;
      default:
        return value;
    }
  };

  const renderPetCard = ({ item, index }: { item: Pet; index: number }) => (
    <View style={[
      styles.cardWrapper,
      index % 2 === 0 ? styles.cardLeft : styles.cardRight
    ]}>
      <PetCard pet={item} onPress={onPetPress} compact />
    </View>
  );

  const renderEmpty = () => {
    const hasActiveFilters = Object.keys(filters).length > 0;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🐾</Text>
        <Text style={styles.emptyText}>
          {hasActiveFilters ? '条件に合う猫ちゃんが見つかりませんでした' : '猫ちゃんが見つかりませんでした'}
        </Text>
        <Text style={styles.emptySubtext}>
          {hasActiveFilters
            ? 'フィルター条件を変更してみてください'
            : 'API Gateway (localhost:18081) との接続を確認してください'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={handleClearFilters}>
            <Text style={styles.clearFiltersButtonText}>フィルターをクリア</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    const activeFilterCount = Object.keys(filters).length;

    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logoEmoji}>🐱</Text>
            <Text style={styles.logoText}>OnlyCats</Text>
          </View>
          <Text style={styles.title}>里親募集中の猫たち</Text>
          <Text style={styles.subtitle}>
            {total > 0 ? `${total}匹の可愛い猫があなたを待っています` : 'ロード中...'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="猫の名前や品種で検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterChipsContainer}
            contentContainerStyle={styles.filterChipsContent}
          >
            {Object.entries(filters).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={styles.filterChip}
                onPress={() => removeFilter(key as keyof FilterOptions)}
              >
                <Text style={styles.filterChipText}>
                  {getFilterLabel(key as keyof FilterOptions, value)}
                </Text>
                <Text style={styles.filterChipClose}>×</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearAllText}>すべてクリア</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Ad Banner */}
        <View style={styles.adContainer}>
          <AdBanner />
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>猫ちゃん情報を読み込み中...</Text>
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
        numColumns={numColumns}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8C00']}
            tintColor="#FF8C00"
          />
        }
        contentContainerStyle={[
          styles.listContent,
          pets.length === 0 ? styles.emptyContent : undefined
        ]}
        columnWrapperStyle={pets.length > 0 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Ad Banner */}
      <View style={styles.bottomAdContainer}>
        <AdBanner />
      </View>

      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FF8C00',
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
    marginTop: 16,
  },
  cardLeft: {
    marginRight: 0,
  },
  cardRight: {
    marginLeft: 0,
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
  clearFiltersButton: {
    marginTop: 20,
    backgroundColor: '#FF8C00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FF8C00',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterChipsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#D97706',
    marginRight: 4,
  },
  filterChipClose: {
    fontSize: 18,
    color: '#D97706',
    fontWeight: 'bold',
  },
  clearAllButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearAllText: {
    fontSize: 14,
    color: '#666',
  },
  adContainer: {
    paddingVertical: 8,
    backgroundColor: '#FFF9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  bottomAdContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0E8E0',
    backgroundColor: '#fff',
  },
});

export default PetListScreen;
