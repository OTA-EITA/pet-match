'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function ProfileContent() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'adopter':
        return '里親希望者';
      case 'shelter':
        return '保護団体';
      case 'individual':
        return '個人';
      default:
        return type;
    }
  };

  const isShelterOrIndividual = user.type === 'shelter' || user.type === 'individual';

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#E3F2FD] rounded-full flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-2 bg-[#FFF5E6] text-[#D97706] text-sm px-3 py-1 rounded-full border border-[#FFD9B3]">
                {getUserTypeLabel(user.type)}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">アカウント情報</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex justify-between">
              <span className="text-gray-600">ユーザーID</span>
              <span className="text-gray-800 font-mono text-sm">{user.id}</span>
            </div>
            <div className="px-6 py-4 flex justify-between">
              <span className="text-gray-600">登録日</span>
              <span className="text-gray-800">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('ja-JP') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">メニュー</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <Link href="/favorites" className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-xl mr-4">❤️</span>
              <span className="flex-1 text-gray-800">お気に入り</span>
              <span className="text-gray-400">›</span>
            </Link>
            <Link href="/inquiries" className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-xl mr-4">📞</span>
              <span className="flex-1 text-gray-800">問い合わせ履歴</span>
              <span className="text-gray-400">›</span>
            </Link>
          </div>
        </div>

        {/* Shelter/Individual Menu */}
        {isShelterOrIndividual && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">譲渡管理</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <Link href="/my-pets" className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                <Image src="/cat-logo.png" alt="" width={24} height={24} className="mr-4" />
                <span className="flex-1 text-gray-800">登録したペット</span>
                <span className="text-gray-400">›</span>
              </Link>
              <Link href="/pets/new" className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-xl mr-4">➕</span>
                <span className="flex-1 text-gray-800">新規ペット登録</span>
                <span className="text-gray-400">›</span>
              </Link>
              <Link href="/received-inquiries" className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-xl mr-4">📬</span>
                <span className="flex-1 text-gray-800">受信した問い合わせ</span>
                <span className="text-gray-400">›</span>
              </Link>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full bg-white rounded-2xl shadow-lg px-6 py-4 text-red-500 font-medium hover:bg-red-50 transition-colors border-2 border-red-100"
        >
          ログアウト
        </button>

        {/* Version */}
        <p className="text-center text-gray-400 text-sm mt-8">OnlyCats v1.0.0</p>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
