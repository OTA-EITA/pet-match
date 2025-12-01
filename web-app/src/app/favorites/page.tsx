'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import PetCard from '@/components/PetCard';
import { favoritesApi, petsApi, Pet, Favorite } from '@/lib/api';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function FavoritesContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchFavorites();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    setError('');

    const result = await favoritesApi.getAll();
    if (result.data) {
      setFavorites(result.data.favorites || []);

      // Fetch pet details for each favorite
      const petPromises = (result.data.favorites || []).map(async (fav) => {
        const petResult = await petsApi.getById(fav.pet_id);
        return petResult.data;
      });

      const petResults = await Promise.all(petPromises);
      setPets(petResults.filter((p): p is Pet => p !== undefined));
    } else {
      setError(result.error || 'お気に入りの取得に失敗しました');
    }
    setIsLoading(false);
  };

  const handleRemoveFavorite = async (petId: string) => {
    const result = await favoritesApi.remove(petId);
    if (!result.error) {
      setFavorites(favorites.filter(f => f.pet_id !== petId));
      setPets(pets.filter(p => p.id !== petId));
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
          <p className="text-gray-600 mb-8">お気に入りを表示するにはログインしてください</p>
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
          <h1 className="text-2xl md:text-3xl font-bold">お気に入り</h1>
          <p className="text-white/90 mt-2">
            {pets.length > 0 ? `${pets.length}匹の猫をお気に入り登録中` : 'お気に入りの猫を管理'}
          </p>
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
              onClick={fetchFavorites}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-lg text-gray-600 mb-2">お気に入りがありません</p>
            <p className="text-gray-500 mb-6">気になる猫を見つけたら、ハートをタップしてお気に入りに追加しましょう</p>
            <Link
              href="/pets"
              className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
            >
              猫を探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="relative">
                <PetCard pet={pet} />
                <button
                  onClick={() => handleRemoveFavorite(pet.id)}
                  className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors"
                  title="お気に入りから削除"
                >
                  <span className="text-red-500 text-xl">❤️</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <AuthProvider>
      <FavoritesContent />
    </AuthProvider>
  );
}
