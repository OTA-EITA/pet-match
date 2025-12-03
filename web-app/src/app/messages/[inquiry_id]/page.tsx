'use client';

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { messagesApi, inquiriesApi, Message, Inquiry } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function ChatContent({ params }: { params: Promise<{ inquiry_id: string }> }) {
  const resolvedParams = use(params);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, resolvedParams.inquiry_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    const [messagesResult, inquiryResult] = await Promise.all([
      messagesApi.getMessages(resolvedParams.inquiry_id),
      inquiriesApi.getById(resolvedParams.inquiry_id),
    ]);

    if (messagesResult.data?.messages) {
      setMessages(messagesResult.data.messages);
    }

    if (inquiryResult.data?.inquiry) {
      setInquiry(inquiryResult.data.inquiry);
    } else {
      setError('問い合わせ情報の取得に失敗しました');
    }

    // Mark as read
    await messagesApi.markAsRead(resolvedParams.inquiry_id);

    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !inquiry || !user) return;

    setIsSending(true);
    const receiverId = user.id === inquiry.user_id ? inquiry.pet_owner_id : inquiry.user_id;

    const result = await messagesApi.sendMessage(
      resolvedParams.inquiry_id,
      receiverId,
      newMessage.trim()
    );

    if (result.data?.message) {
      setMessages([...messages, result.data.message]);
      setNewMessage('');
    }
    setIsSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

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
    <div className="min-h-screen bg-[#FFF9F0] flex flex-col">
      <Header />

      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/messages" className="text-gray-600 hover:text-[#FF8C00]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          {inquiry && (
            <div className="flex-1">
              <h1 className="font-bold text-gray-800">チャット</h1>
              <Link href={`/pets/${inquiry.pet_id}`} className="text-sm text-[#FF8C00] hover:underline">
                問い合わせ中のペットを見る
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/messages" className="text-[#FF8C00] hover:underline">
              メッセージ一覧に戻る
            </Link>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex justify-center my-4">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(msgs[0].created_at)}
                  </span>
                </div>

                {/* Messages */}
                {msgs.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-[#FF8C00] text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                          {formatTime(message.created_at)}
                          {isOwnMessage && message.read_at && (
                            <span className="ml-1">既読</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                メッセージはまだありません。最初のメッセージを送信しましょう。
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="bg-[#FF8C00] text-white p-3 rounded-xl hover:bg-[#E67E00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage({ params }: { params: Promise<{ inquiry_id: string }> }) {
  return <ChatContent params={params} />;
}
