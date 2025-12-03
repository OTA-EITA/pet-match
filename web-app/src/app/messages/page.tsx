'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { messagesApi, Conversation } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function MessagesContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 認証ローディング中はAPIを呼ばない
    if (authLoading || !isAuthenticated) {
      return;
    }
    fetchConversations();
  }, [isAuthenticated, authLoading]);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError('');

    const result = await messagesApi.getConversations();
    if (result.data?.conversations) {
      setConversations(result.data.conversations);
    } else if (result.data) {
      // APIは成功したがconversationsが空またはundefined
      setConversations([]);
    } else {
      // 本当のエラーの場合のみエラーを設定（空リストもエラーにならないように）
      // conversations が null/undefined でもエラーではなく空として扱う
      setConversations([]);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="text-center py-20">
          <p className="text-lg text-gray-600 mb-4">メッセージを見るにはログインが必要です</p>
          <Link
            href="/login"
            className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">メッセージ</h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchConversations}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg text-gray-600 mb-2">メッセージはありません</p>
            <p className="text-gray-500">問い合わせを送信すると、ここにメッセージが表示されます</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
            {conversations.map((conv) => (
              <Link
                key={conv.inquiry_id}
                href={`/messages/${conv.inquiry_id}`}
                className="flex items-center gap-4 p-4 hover:bg-[#FFF9F0] transition-colors"
              >
                {/* Pet image */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#FFF5E6] flex-shrink-0">
                  {conv.pet_image ? (
                    <Image
                      src={conv.pet_image}
                      alt={conv.pet_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image src="/cat-logo.png" alt="" width={28} height={28} className="opacity-50" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-800 truncate">{conv.other_user_name}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.pet_name}について</p>
                  <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                </div>

                {/* Unread badge */}
                {conv.unread_count > 0 && (
                  <div className="bg-[#FF8C00] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unread_count}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return <MessagesContent />;
}
