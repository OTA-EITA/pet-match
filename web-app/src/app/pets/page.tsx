'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import PetCard from '@/components/PetCard';
import { petsApi, Pet } from '@/lib/api';
import { AuthProvider } from '@/contexts/AuthContext';

function PetsContent() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Filters
  const [gender, setGender] = useState('');
  const [size, setSize] = useState('');
  const [breed, setBreed] = useState('');

  useEffect(() => {
    fetchPets();
  }, [gender, size, breed]);

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
      setPets(result.data.pets || []);
      setTotal(result.data.total || 0);
    } else {
      setError(result.error || '猫ちゃん情報の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const clearFilters = () => {
    setGender('');
    setSize('');
    setBreed('');
  };

  const hasFilters = gender || size || breed;

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

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-[#FF8C00] hover:bg-[#FFF5E6] rounded-lg transition-colors"
              >
                クリア
              </button>
            )}
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
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
