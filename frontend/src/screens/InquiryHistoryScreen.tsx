import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { inquiryApi, Inquiry } from '../api/inquiryApi';

type Props = StackScreenProps<RootStackParamList, 'InquiryHistory'>;

const InquiryHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const data = await inquiryApi.getInquiries();
      setInquiries(data);
    } catch (error) {
      Alert.alert('エラー', '問い合わせ履歴の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInquiries();
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return '送信済み';
      case 'replied':
        return '返信あり';
      case 'scheduled':
        return '面談予定';
      case 'completed':
        return '完了';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return '#999';
      case 'replied':
        return '#2196F3';
      case 'scheduled':
        return '#FF9800';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const renderInquiry = ({ item }: { item: Inquiry }) => (
    <View style={styles.inquiryCard}>
      <View style={styles.inquiryHeader}>
        <View style={styles.inquiryType}>
          <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.inquiryMessage} numberOfLines={3}>
        {item.message}
      </Text>

      <View style={styles.inquiryFooter}>
        <Text style={styles.inquiryDate}>
          {new Date(item.created_at).toLocaleDateString('ja-JP')}
        </Text>
        <Text style={styles.contactMethod}>
          連絡方法: {item.contact_method === 'email' ? 'メール' : '電話'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {inquiries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>問い合わせ履歴がありません</Text>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          renderItem={renderInquiry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  inquiryType: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#2196F3',
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
  inquiryMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inquiryDate: {
    fontSize: 12,
    color: '#999',
  },
  contactMethod: {
    fontSize: 12,
    color: '#666',
  },
});

export default InquiryHistoryScreen;
