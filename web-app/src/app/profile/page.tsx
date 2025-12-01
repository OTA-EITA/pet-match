'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

interface SavedSearchCondition {
  id: string;
  name: string;
  gender: string;
  size: string;
  breed: string;
  location: string;
  savedAt: string;
}

interface ViewHistoryItem {
  id: string;
  name: string;
  breed: string;
  image?: string;
  viewedAt: string;
}

function ProfileContent() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearchCondition[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    // Load saved searches and view history from localStorage
    if (typeof window !== 'undefined') {
      try {
        const searches = JSON.parse(localStorage.getItem('saved_search_conditions') || '[]');
        setSavedSearches(searches);
        const history = JSON.parse(localStorage.getItem('pet_view_history') || '[]');
        setViewHistory(history);
      } catch {
        // Ignore parse errors
      }
    }
  }, [isLoading, isAuthenticated, router]);

  const deleteSavedSearch = (id: string) => {
    const searches = savedSearches.filter(s => s.id !== id);
    localStorage.setItem('saved_search_conditions', JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const clearViewHistory = () => {
    localStorage.removeItem('pet_view_history');
    setViewHistory([]);
  };

  const applySearch = (search: SavedSearchCondition) => {
    const params = new URLSearchParams();
    if (search.gender) params.set('gender', search.gender);
    if (search.size) params.set('size', search.size);
    if (search.breed) params.set('breed', search.breed);
    if (search.location) params.set('location', search.location);
    router.push(`/pets?${params.toString()}`);
  };

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

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">保存した検索条件</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {savedSearches.map((search) => (
                <div key={search.id} className="px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => applySearch(search)}
                    className="text-left flex-1"
                  >
                    <span className="text-[#FF8C00] font-medium">{search.name}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {[
                        search.gender && (search.gender === 'male' ? 'オス' : 'メス'),
                        search.size && (search.size === 'small' ? '小型' : search.size === 'medium' ? '中型' : '大型'),
                        search.breed,
                        search.location,
                      ].filter(Boolean).join(' / ')}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(search.id)}
                    className="ml-4 text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View History */}
        {viewHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">最近見た猫</h2>
              <button
                onClick={clearViewHistory}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                クリア
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {viewHistory.slice(0, 10).map((item) => (
                  <Link
                    key={item.id}
                    href={`/pets/${item.id}`}
                    className="flex-shrink-0 w-20"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#FFF5E6]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image src="/cat-logo.png" alt="" width={28} height={28} className="opacity-30" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800 mt-1 truncate">{item.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

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
              <Link href="/pets/register" className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
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
