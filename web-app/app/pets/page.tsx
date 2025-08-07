'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { petApi } from '@/lib/api';
import { Pet } from '@/types/Pet';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PetsPage() {
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
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      if (response && response.pets) {
        console.log('Pets array:', response.pets);
        console.log('Pets length:', response.pets.length);
        console.log('Total count:', response.total);
        setPets(response.pets);
      } else {
        console.log('⚠️ No pets field in response or response is null');
        console.log('Setting empty pets array');
        setPets([]);
      }
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
    console.log('PetsPage mounted');
    checkApiHealth();
    fetchPets();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ローディングスケルトン */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">里親募集中のペット</h1>
            <p className="text-gray-600">ペット情報を読み込み中...</p>
          </div>
          
          {/* スケルトンカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-8xl mb-6">😿</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">エラーが発生しました</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={fetchPets}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  再試行
                </button>
                
                <Link 
                  href="/"
                  className="text-gray-600 hover:text-gray-800 font-medium underline transition-colors"
                >
                  ホームに戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">里親募集中のペット</h1>
        <p className="text-gray-600">
        {loading ? 'ロード中...' : pets.length > 0 ? `${pets.length}匹の可愛いペットたちが家族を待っています` : 'まだペットが登録されていません'}
        </p>
        </div>

        {/* ペットカード一覧 */}
        {!loading && pets.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-8xl mb-6">🐾</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">まだペットが登録されていません</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                里親を募集しているペットがまだ登録されていないようです。<br/>
                新しいペットが登録されるまでしばらくお待ちください。
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={fetchPets}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  再読み込み
                </button>
                
                <Link 
                  href="/my-pets"
                  className="text-gray-600 hover:text-gray-800 font-medium underline transition-colors"
                >
                  ペットを登録する
                </Link>
              </div>
              
              {/* 開発者向けのヒント（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-12 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                  <h4 className="font-medium text-amber-800 mb-2">🔧 開発者向け</h4>
                  <p className="text-sm text-amber-700 mb-3">サンプルデータを作成する方法:</p>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700">方法 1: 既存のスクリプトを使用</p>
                    <code className="block bg-amber-100 text-amber-800 px-3 py-2 rounded text-xs font-mono">
                      ./create-sample-pets.sh
                    </code>
                    
                    <p className="text-xs text-amber-700 mt-3">方法 2: 手動で作成</p>
                    <code className="block bg-amber-100 text-amber-800 px-3 py-2 rounded text-xs font-mono">
                      redis-cli SET 'pet:demo-001' '{'"id":"demo-001","name":"Demo Pet","species":"Dog",...'}'
                    </code>
                    
                    <p className="text-xs text-amber-700 mt-3">方法 3: ペット作成ページから</p>
                    <Link href="/my-pets" className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                      ペットを登録する
                    </Link>
                  </div>
                </div>
              )}
            </div>
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
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
    </ProtectedRoute>
  );
}
