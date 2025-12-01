'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { inquiriesApi, Inquiry } from '@/lib/api';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<Inquiry['status'], string> = {
  sent: '新規',
  replied: '返信済み',
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

function ReceivedInquiriesContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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

    const result = await inquiriesApi.getReceived();
    if (result.data) {
      setInquiries(result.data.inquiries || []);
    } else {
      setError(result.error || '問い合わせの取得に失敗しました');
    }
    setIsLoading(false);
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;

    const result = await inquiriesApi.reply(id, replyText);
    if (result.data) {
      setInquiries(inquiries.map(inq =>
        inq.id === id ? result.data!.inquiry : inq
      ));
      setReplyingTo(null);
      setReplyText('');
    }
  };

  const handleStatusChange = async (id: string, status: Inquiry['status']) => {
    const result = await inquiriesApi.updateStatus(id, status);
    if (result.data) {
      setInquiries(inquiries.map(inq =>
        inq.id === id ? result.data!.inquiry : inq
      ));
    }
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

  if (user?.type === 'adopter') {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">このページは保護団体・個人の方専用です</h1>
          <Link
            href="/inquiries"
            className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
          >
            問い合わせ履歴を見る
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
          <h1 className="text-2xl md:text-3xl font-bold">受信した問い合わせ</h1>
          <p className="text-white/90 mt-2">
            {inquiries.length > 0 ? `${inquiries.length}件の問い合わせ` : 'あなたのペットへの問い合わせを管理'}
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
            <div className="text-6xl mb-4">📬</div>
            <p className="text-lg text-gray-600 mb-2">問い合わせはまだありません</p>
            <p className="text-gray-500 mb-6">ペットを登録すると、里親希望者から問い合わせが届きます</p>
            <Link
              href="/pets/register"
              className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
            >
              ペットを登録
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[inquiry.status]}`}>
                      {statusLabels[inquiry.status]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {typeLabels[inquiry.type]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(inquiry.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{inquiry.message}</p>

                <div className="text-sm text-gray-500 mb-4">
                  連絡方法: {inquiry.contact_method === 'email' ? 'メール' : '電話'}
                  {inquiry.phone && ` (${inquiry.phone})`}
                </div>

                {inquiry.reply && (
                  <div className="bg-[#FFF5E6] rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-[#FF8C00] mb-2">あなたの返信</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{inquiry.reply}</p>
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === inquiry.id ? (
                  <div className="border-t border-gray-100 pt-4">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="返信メッセージを入力..."
                      rows={3}
                      className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(inquiry.id)}
                        className="px-4 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
                      >
                        返信する
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex gap-2">
                      {!inquiry.reply && (
                        <button
                          onClick={() => setReplyingTo(inquiry.id)}
                          className="px-4 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors text-sm"
                        >
                          返信する
                        </button>
                      )}
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value as Inquiry['status'])}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="sent">新規</option>
                        <option value="replied">返信済み</option>
                        <option value="scheduled">面談予定</option>
                        <option value="completed">完了</option>
                        <option value="rejected">お断り</option>
                      </select>
                    </div>
                    <Link
                      href={`/pets/${inquiry.pet_id}`}
                      className="text-[#FF8C00] hover:underline text-sm"
                    >
                      ペット詳細 →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReceivedInquiriesPage() {
  return (
    <AuthProvider>
      <ReceivedInquiriesContent />
    </AuthProvider>
  );
}
