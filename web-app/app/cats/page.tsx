'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { API_CONFIG } from '@/lib/config';

interface Cat {
  id: string;
  name: string;
  breed: string;
  species: string;
  age_info?: {
    years: number;
    months: number;
    age_text: string;
  };
  gender: string;
  size: string;
  description: string;
  images?: string[];
}

export default function CatsPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_CONFIG.API_URL}${API_CONFIG.ENDPOINTS.PETS.LIST}?species=cat`);
      
      console.log('API Response:', response.data);
      
      if (response.data.pets) {
        setCats(response.data.pets);
      } else {
        setCats([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch cats:', err);
      setError(err.message || 'Failed to load cats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😿</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">エラーが発生しました</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button 
            onClick={fetchCats}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 touchable"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            🐱 猫を探す
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">
            {cats.length}匹の猫があなたを待っています
          </p>
        </div>
      </div>

      {/* フィルター（TODO: 実装予定） */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollable-x">
            <button className="px-4 py-2 rounded-full bg-primary-500 text-white font-medium whitespace-nowrap touchable">
              すべて
            </button>
            <button className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 font-medium whitespace-nowrap touchable hover:bg-neutral-200">
              子猫
            </button>
            <button className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 font-medium whitespace-nowrap touchable hover:bg-neutral-200">
              成猫
            </button>
            <button className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 font-medium whitespace-nowrap touchable hover:bg-neutral-200">
              オス
            </button>
            <button className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 font-medium whitespace-nowrap touchable hover:bg-neutral-200">
              メス
            </button>
          </div>
        </div>
      </div>

      {/* 猫一覧グリッド */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {cats.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😺</div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">猫がいません</h3>
            <p className="text-neutral-600">条件に合う猫が見つかりませんでした</p>
          </div>
        ) : (
          <div className="cat-grid">
            {cats.map((cat) => (
              <Link
                key={cat.id}
                href={`/cats/${cat.id}`}
                className="card group cursor-pointer hover:shadow-card-hover transition-all touchable"
              >
                {/* 猫写真 */}
                <div className="cat-photo-card bg-gradient-to-br from-neutral-200 to-neutral-300">
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    😺
                  </div>
                </div>

                {/* 猫情報 */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <span>{cat.breed}</span>
                    <span>•</span>
                    <span>{cat.age_info?.age_text || `${cat.age_info?.years || 0}歳`}</span>
                    <span>•</span>
                    <span>{cat.gender === 'male' ? '♂' : '♀'}</span>
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
