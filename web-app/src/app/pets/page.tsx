'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import PetCard from '@/components/PetCard';
import { petsApi, Pet } from '@/lib/api';
import { AuthProvider } from '@/contexts/AuthContext';

interface ViewHistoryItem {
  id: string;
  name: string;
  breed: string;
  image?: string;
  viewedAt: string;
}

function PetsContent() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Filters
  const [gender, setGender] = useState('');
  const [size, setSize] = useState('');
  const [breed, setBreed] = useState('');
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // View history
  const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPets();
    loadViewHistory();
  }, [gender, size, breed, location]);

  const fetchPets = async () => {
    setIsLoading(true);
    setError('');

    const result = await petsApi.getAll({
      species: 'cat',
      limit: 20,
      gender: gender || undefined,
      size: size || undefined,
      breed: breed || undefined,
    });

    if (result.data) {
      let filteredPets = result.data.pets || [];
      // Client-side location filter (API might not support it)
      if (location) {
        filteredPets = filteredPets.filter(p =>
          p.location?.toLowerCase().includes(location.toLowerCase())
        );
      }
      setPets(filteredPets);
      setTotal(result.data.total || 0);
    } else {
      setError(result.error || '猫ちゃん情報の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const loadViewHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('pet_view_history') || '[]');
      setViewHistory(history);
    } catch {
      setViewHistory([]);
    }
  };

  const clearViewHistory = () => {
    localStorage.removeItem('pet_view_history');
    setViewHistory([]);
  };

  const clearFilters = () => {
    setGender('');
    setSize('');
    setBreed('');
    setLocation('');
  };

  const hasFilters = gender || size || breed || location;
  const activeFiltersCount = [gender, size, breed, location].filter(Boolean).length;

  // 人気品種リスト
  const popularBreeds = ['ミックス', 'スコティッシュフォールド', 'マンチカン', 'アメリカンショートヘア', 'ノルウェージャン'];

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      {/* Hero Section */}
      <div className="bg-[#FF8C00] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/cat-logo.png" alt="" width={40} height={40} />
            <h1 className="text-2xl md:text-3xl font-bold">里親募集中の猫たち</h1>
          </div>
          <p className="text-white/90">
            {total > 0 ? `${total}匹の可愛い猫があなたを待っています` : 'ロード中...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#F0E8E0] py-4 px-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto">
          {/* Mobile filter toggle */}
          <div className="md:hidden flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFF5E6] text-[#FF8C00] rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              フィルター
              {activeFiltersCount > 0 && (
                <span className="bg-[#FF8C00] text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              履歴
            </button>
          </div>

          {/* Desktop filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="px-4 py-2 border border-[#FFD9B3] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
              >
                <option value="">性別</option>
                <option value="male">オス</option>
                <option value="female">メス</option>
              </select>

              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="px-4 py-2 border border-[#FFD9B3] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
              >
                <option value="">サイズ</option>
                <option value="small">小型</option>
                <option value="medium">中型</option>
                <option value="large">大型</option>
              </select>

              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="品種で検索..."
                className="px-4 py-2 border border-[#FFD9B3] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00] w-48"
              />

              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="地域で検索..."
                className="px-4 py-2 border border-[#FFD9B3] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00] w-36"
              />

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-[#FF8C00] hover:bg-[#FFF5E6] rounded-lg transition-colors"
                >
                  クリア
                </button>
              )}

              {/* Desktop history button */}
              <div className="hidden md:block ml-auto">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  最近見た猫
                  {viewHistory.length > 0 && (
                    <span className="text-xs text-gray-400">({viewHistory.length})</span>
                  )}
                </button>
              </div>
            </div>

            {/* Popular breeds */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">人気品種:</span>
              {popularBreeds.map((b) => (
                <button
                  key={b}
                  onClick={() => setBreed(b)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    breed === b
                      ? 'bg-[#FF8C00] text-white'
                      : 'bg-[#FFF5E6] text-[#FF8C00] hover:bg-[#FFE5CC]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View History Panel */}
      {showHistory && viewHistory.length > 0 && (
        <div className="bg-white border-b border-[#F0E8E0] py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">最近見た猫</h3>
              <button
                onClick={clearViewHistory}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                履歴をクリア
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {viewHistory.slice(0, 10).map((item) => (
                <Link
                  key={item.id}
                  href={`/pets/${item.id}`}
                  className="flex-shrink-0 w-24"
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#FFF5E6]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/cat-logo.png" alt="" width={32} height={32} className="opacity-30" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate">{item.breed}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">猫ちゃん情報を読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchPets}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-20">
            <Image src="/cat-logo.png" alt="" width={80} height={80} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg text-gray-600 mb-2">
              {hasFilters ? '条件に合う猫ちゃんが見つかりませんでした' : '猫ちゃんが見つかりませんでした'}
            </p>
            <p className="text-gray-500 mb-4">
              {hasFilters ? 'フィルター条件を変更してみてください' : 'APIサーバーへの接続を確認してください'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
              >
                フィルターをクリア
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-gray-500 mb-4">
              {hasFilters && `${pets.length}件の結果`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PetsPage() {
  return (
    <AuthProvider>
      <PetsContent />
    </AuthProvider>
  );
}
