'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { petsApi, Pet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<Pet['status'], string> = {
  available: '募集中',
  pending: '交渉中',
  adopted: '譲渡済み',
};

const statusColors: Record<Pet['status'], string> = {
  available: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  adopted: 'bg-gray-100 text-gray-800',
};

function MyPetsContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchMyPets();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchMyPets = async () => {
    setIsLoading(true);
    setError('');

    const result = await petsApi.getMyPets();
    if (result.data) {
      setPets(result.data.pets || []);
    } else {
      setError(result.error || 'ペット情報の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このペットを削除してもよろしいですか？')) return;

    const result = await petsApi.delete(id);
    if (!result.error) {
      setPets(pets.filter(p => p.id !== id));
    } else {
      alert(result.error || '削除に失敗しました');
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
          <p className="text-gray-600 mb-8">
            ペットを登録するには、保護団体または個人としてアカウントを作成してください
          </p>
          <Link
            href="/pets"
            className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
          >
            猫を探す
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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">登録したペット</h1>
            <p className="text-white/90 mt-2">
              {pets.length > 0 ? `${pets.length}匹を管理中` : 'あなたのペットを管理'}
            </p>
          </div>
          <Link
            href="/pets/register"
            className="px-6 py-3 bg-white text-[#FF8C00] rounded-xl font-bold hover:bg-[#FFF5E6] transition-colors"
          >
            新規登録
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchMyPets}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-20">
            <Image src="/cat-logo.png" alt="" width={80} height={80} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg text-gray-600 mb-2">登録したペットがいません</p>
            <p className="text-gray-500 mb-6">里親を探したいペットを登録しましょう</p>
            <Link
              href="/pets/register"
              className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
            >
              ペットを登録
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Image */}
                <div className="aspect-video bg-[#FFF5E6] relative">
                  {pet.images && pet.images.length > 0 ? (
                    <Image
                      src={pet.images[0]}
                      alt={pet.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image src="/cat-logo.png" alt="" width={60} height={60} className="opacity-30" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium ${statusColors[pet.status]}`}>
                    {statusLabels[pet.status]}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{pet.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {pet.breed} / {pet.gender === 'male' ? 'オス' : 'メス'} / {pet.age_info?.age_text || ''}
                  </p>

                  <div className="flex gap-2">
                    <Link
                      href={`/pets/${pet.id}`}
                      className="flex-1 text-center py-2 border border-[#FF8C00] text-[#FF8C00] rounded-lg hover:bg-[#FFF5E6] transition-colors text-sm"
                    >
                      詳細
                    </Link>
                    <Link
                      href={`/pets/${pet.id}/edit`}
                      className="flex-1 text-center py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors text-sm"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="px-3 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MyPetsPage() {
  return <MyPetsContent />;
}
