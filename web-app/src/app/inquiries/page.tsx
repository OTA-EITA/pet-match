'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { inquiriesApi, Inquiry } from '@/lib/api';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<Inquiry['status'], string> = {
  sent: '送信済み',
  replied: '返信あり',
  scheduled: '面談予定',
  completed: '完了',
  rejected: 'お断り',
};

const statusColors: Record<Inquiry['status'], string> = {
  sent: 'bg-blue-100 text-blue-800',
  replied: 'bg-green-100 text-green-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

const typeLabels: Record<Inquiry['type'], string> = {
  question: '質問',
  interview: '面談希望',
  adoption: '譲渡希望',
};

function InquiriesContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchInquiries();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchInquiries = async () => {
    setIsLoading(true);
    setError('');

    const result = await inquiriesApi.getAll();
    if (result.data) {
      setInquiries(result.data.inquiries || []);
    } else {
      setError(result.error || '問い合わせ履歴の取得に失敗しました');
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-8">問い合わせ履歴を表示するにはログインしてください</p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      {/* Hero Section */}
      <div className="bg-[#FF8C00] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">問い合わせ履歴</h1>
          <p className="text-white/90 mt-2">
            {inquiries.length > 0 ? `${inquiries.length}件の問い合わせ` : '問い合わせ履歴を確認'}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchInquiries}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg text-gray-600 mb-2">問い合わせ履歴がありません</p>
            <p className="text-gray-500 mb-6">気になる猫がいたら、問い合わせしてみましょう</p>
            <Link
              href="/pets"
              className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
            >
              猫を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[inquiry.status]}`}>
                      {statusLabels[inquiry.status]}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {typeLabels[inquiry.type]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(inquiry.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{inquiry.message}</p>

                {inquiry.reply && (
                  <div className="bg-[#FFF5E6] rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-[#FF8C00] mb-2">返信</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{inquiry.reply}</p>
                    {inquiry.replied_at && (
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(inquiry.replied_at).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    連絡方法: {inquiry.contact_method === 'email' ? 'メール' : '電話'}
                    {inquiry.phone && ` (${inquiry.phone})`}
                  </div>
                  <Link
                    href={`/pets/${inquiry.pet_id}`}
                    className="text-[#FF8C00] hover:underline text-sm"
                  >
                    詳細を見る →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function InquiriesPage() {
  return (
    <AuthProvider>
      <InquiriesContent />
    </AuthProvider>
  );
}
