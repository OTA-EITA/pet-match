import React, { useState, useEffect, useCallback } from 'react';
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
import AdBanner from '../components/AdBanner';

type Props = StackScreenProps<RootStackParamList, 'ReceivedInquiries'>;

interface ReceivedInquiry {
  id: string;
  pet_id: string;
  pet_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  type: 'question' | 'interview' | 'adoption';
  contact_method: 'email' | 'phone';
  phone?: string;
  status: 'new' | 'replied' | 'scheduled' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Mock data for development
const MOCK_INQUIRIES: ReceivedInquiry[] = [
  {
    id: 'inq-1',
    pet_id: 'my-pet-1',
    pet_name: 'ミケ',
    user_id: 'user-1',
    user_name: '田中太郎',
    user_email: 'tanaka@example.com',
    message: 'ミケちゃんに興味があります。一度会いに行くことは可能でしょうか？家族で猫を飼うのは初めてですが、責任を持って育てたいと思っています。',
    type: 'interview',
    contact_method: 'email',
    status: 'new',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 'inq-2',
    pet_id: 'my-pet-2',
    pet_name: 'トラ',
    user_id: 'user-2',
    user_name: '鈴木花子',
    user_email: 'suzuki@example.com',
    message: 'トラくんの健康状態について詳しく教えていただけますか？ワクチン接種の状況なども知りたいです。',
    type: 'question',
    contact_method: 'phone',
    phone: '090-1234-5678',
    status: 'replied',
    created_at: '2024-03-14T15:30:00Z',
    updated_at: '2024-03-14T16:00:00Z',
  },
  {
    id: 'inq-3',
    pet_id: 'my-pet-1',
    pet_name: 'ミケ',
    user_id: 'user-3',
    user_name: '佐藤一郎',
    user_email: 'sato@example.com',
    message: 'ミケちゃんの譲渡を正式に申し込みたいです。必要な書類等があれば教えてください。',
    type: 'adoption',
    contact_method: 'email',
    status: 'scheduled',
    created_at: '2024-03-13T09:00:00Z',
    updated_at: '2024-03-13T12:00:00Z',
  },
];

const ReceivedInquiriesScreen: React.FC<Props> = ({ navigation }) => {
  const [inquiries, setInquiries] = useState<ReceivedInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');

  const loadInquiries = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await inquiryApi.getReceivedInquiries();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setInquiries(MOCK_INQUIRIES);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      Alert.alert('エラー', '問い合わせの取得に失敗しました');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInquiries();
  };

  const handleUpdateStatus = (inquiry: ReceivedInquiry, newStatus: ReceivedInquiry['status']) => {
    Alert.alert(
      'ステータス変更',
      `ステータスを「${getStatusLabel(newStatus)}」に変更しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更',
          onPress: async () => {
            try {
              // TODO: Call API to update status
              // await inquiryApi.updateInquiryStatus(inquiry.id, newStatus);
              setInquiries((prev) =>
                prev.map((inq) =>
                  inq.id === inquiry.id ? { ...inq, status: newStatus } : inq
                )
              );
            } catch (error) {
              Alert.alert('エラー', 'ステータスの更新に失敗しました');
            }
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'question':
        return '質問';
      case 'interview':
        return '面談希望';
      case 'adoption':
        return '譲渡申し込み';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return '#2196F3';
      case 'interview':
        return '#FF9800';
      case 'adoption':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return '新着';
      case 'replied':
        return '返信済み';
      case 'scheduled':
        return '面談予定';
      case 'completed':
        return '完了';
      case 'rejected':
        return 'お断り';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#f44336';
      case 'replied':
        return '#2196F3';
      case 'scheduled':
        return '#FF9800';
      case 'completed':
        return '#4CAF50';
      case 'rejected':
        return '#9E9E9E';
      default:
        return '#999';
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (filter === 'all') return true;
    if (filter === 'new') return inq.status === 'new';
    if (filter === 'in_progress') return ['replied', 'scheduled'].includes(inq.status);
    if (filter === 'completed') return ['completed', 'rejected'].includes(inq.status);
    return true;
  });

  const renderInquiry = ({ item }: { item: ReceivedInquiry }) => (
    <View style={styles.inquiryCard}>
      <View style={styles.inquiryHeader}>
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.pet_name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeBadgeText}>{getTypeLabel(item.type)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.user_name}</Text>
        <Text style={styles.userEmail}>{item.user_email}</Text>
        {item.phone && <Text style={styles.userPhone}>TEL: {item.phone}</Text>}
      </View>

      <Text style={styles.message} numberOfLines={3}>
        {item.message}
      </Text>

      <View style={styles.inquiryFooter}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('ja-JP')}
        </Text>
        <View style={styles.actionButtons}>
          {item.status === 'new' && (
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => handleUpdateStatus(item, 'replied')}
            >
              <Text style={styles.replyButtonText}>返信済みにする</Text>
            </TouchableOpacity>
          )}
          {item.status === 'replied' && (
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => handleUpdateStatus(item, 'scheduled')}
            >
              <Text style={styles.scheduleButtonText}>面談予定</Text>
            </TouchableOpacity>
          )}
          {['replied', 'scheduled'].includes(item.status) && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleUpdateStatus(item, 'completed')}
            >
              <Text style={styles.completeButtonText}>完了</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📬</Text>
      <Text style={styles.emptyTitle}>問い合わせがありません</Text>
      <Text style={styles.emptyText}>
        ペットを登録すると、ここに問い合わせが表示されます
      </Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {(['all', 'new', 'in_progress', 'completed'] as const).map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          onPress={() => setFilter(f)}
        >
          <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
            {f === 'all' ? 'すべて' : f === 'new' ? '新着' : f === 'in_progress' ? '対応中' : '完了'}
          </Text>
          {f === 'new' && inquiries.filter((i) => i.status === 'new').length > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>
                {inquiries.filter((i) => i.status === 'new').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>受信した問い合わせ</Text>
        <Text style={styles.count}>{filteredInquiries.length}件</Text>
      </View>

      <AdBanner />

      {renderFilters()}

      <FlatList
        data={filteredInquiries}
        renderItem={renderInquiry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />

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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  newBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  inquiryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  userPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  replyButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  scheduleButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scheduleButtonText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
    lineHeight: 24,
  },
  bottomAdContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
});

export default ReceivedInquiriesScreen;
