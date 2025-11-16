'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FavoriteCat {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  location: string;
  addedDate: string;
}

export default function FavoritesPage() {
  const [favorites] = useState<FavoriteCat[]>([
    {
      id: '1',
      name: 'みけ',
      breed: '三毛猫',
      age: 2,
      gender: 'female',
      location: '東京都',
      addedDate: '2024-11-10',
    },
    {
      id: '2',
      name: 'クロ',
      breed: '黒猫',
      age: 1,
      gender: 'male',
      location: '神奈川県',
      addedDate: '2024-11-12',
    },
  ]);

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            ❤️ お気に入り
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">
            {favorites.length}匹の猫を保存しています
          </p>
        </div>
      </div>

      {/* お気に入り一覧 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {favorites.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              お気に入りはまだありません
            </h2>
            <p className="text-neutral-600 mb-6">
              気になる猫を見つけたら、ハートマークを押して保存しましょう
            </p>
            <Link
              href="/cats"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition touchable"
            >
              猫を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((cat) => (
              <Link
                key={cat.id}
                href={`/cats/${cat.id}`}
                className="card p-4 sm:p-6 flex items-center space-x-4 hover:shadow-card-hover transition touchable"
              >
                {/* 猫写真 */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl">😺</span>
                </div>

                {/* 猫情報 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">
                    {cat.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 mb-2">
                    <span>{cat.breed}</span>
                    <span>•</span>
                    <span>{cat.age}歳</span>
                    <span>•</span>
                    <span>{cat.gender === 'male' ? '♂' : '♀'}</span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {cat.location}
                  </div>
                  <div className="text-xs text-neutral-400 mt-2">
                    保存日: {new Date(cat.addedDate).toLocaleDateString('ja-JP')}
                  </div>
                </div>

                {/* お気に入りボタン */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: お気に入り削除処理
                  }}
                  className="flex-shrink-0 text-accent-400 hover:text-accent-500 transition touchable p-2"
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
