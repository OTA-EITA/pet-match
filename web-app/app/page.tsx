'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { petApi } from '@/lib/api';
import { Pet } from '@/types/Pet';

export default function HomePage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== Starting API call ===');
      console.log('Fetching pets from API Gateway...');
      const response = await petApi.getPets(20, 0);
      
      console.log('=== API Response received ===');
      console.log('Response object:', response);
      console.log('Pets array:', response.pets);
      console.log('Pets length:', response.pets.length);
      console.log('Total count:', response.total);
      
      setPets(response.pets);
    } catch (error) {
      console.error('=== API Error ===');
      console.error('Failed to fetch pets:', error);
      setError('ペット情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const checkApiHealth = async () => {
    try {
      const health = await petApi.healthCheck();
      console.log('API Gateway Health:', health);
    } catch (error) {
      console.error('API Gateway not accessible:', error);
    }
  };

  useEffect(() => {
    console.log('HomePage mounted');
    checkApiHealth();
    fetchPets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">ペット情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😿</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchPets}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">里親募集中のペット</h1>
        <p className="text-gray-600">
          {pets.length > 0 ? `${pets.length}匹の可愛いペットたち` : 'ロード中...'}
        </p>
      </div>

      {/* ペットカード一覧 */}
      {pets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">ペットが見つかりませんでした</h3>
          <p className="text-gray-600">API Gateway (localhost:18081) との接続を確認してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <Link 
              key={pet.id} 
              href={`/pets/${pet.id}`}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 group-hover:scale-105 group-hover:shadow-lg">
                {/* ペット画像 */}
                <div className="relative h-48 bg-gray-200">
                  {pet.images && pet.images.length > 0 ? (
                    <Image
                      src={pet.images[0]}
                      alt={pet.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkL48L3RleHQ+PC9zdmc+';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-4xl">🐾</span>
                    </div>
                  )}
                </div>

                {/* ペット情報 */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{pet.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{pet.age_info.age_text}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <span className="mr-3">🐕 {pet.species}</span>
                    <span className="mr-3">📍 {pet.location}</span>
                  </div>

                  {/* 性格タグ */}
                  {pet.personality && pet.personality.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pet.personality.slice(0, 2).map((trait, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-secondary text-primary text-xs rounded-full"
                        >
                          {trait}
                        </span>
                      ))}
                      {pet.personality.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{pet.personality.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    {pet.breed} • {pet.gender === 'male' ? '♂️ オス' : '♀️ メス'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
