'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { usersApi, PublicProfile } from '@/lib/api';

export default function SheltersPage() {
  const [shelters, setShelters] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 12;

  useEffect(() => {
    fetchShelters();
  }, [page]);

  const fetchShelters = async () => {
    setIsLoading(true);
    setError('');

    const result = await usersApi.listShelters(limit, page * limit);
    if (result.data) {
      setShelters(result.data.shelters || []);
      setTotal(result.data.total || 0);
    } else {
      setError(result.error || 'シェルター一覧の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'shelter':
        return 'シェルター';
      case 'individual':
        return '個人ブリーダー';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">シェルター・ブリーダー一覧</h1>
          <p className="text-gray-600">信頼できるシェルターやブリーダーから猫ちゃんを探しましょう</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchShelters}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再試行
            </button>
          </div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#FFF5E6] flex items-center justify-center">
              <svg className="w-12 h-12 text-[#FF8C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500">登録されているシェルター・ブリーダーはまだありません</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shelters.map((shelter) => (
                <Link
                  key={shelter.id}
                  href={`/shelters/${shelter.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {shelter.profile_image ? (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden">
                            <Image
                              src={shelter.profile_image}
                              alt={shelter.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#FFD9B3] flex items-center justify-center">
                            <span className="text-2xl text-[#FF8C00] font-bold">
                              {shelter.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-[#FFF5E6] text-[#D97706] px-2 py-0.5 rounded-full border border-[#FFD9B3]">
                            {getUserTypeLabel(shelter.type)}
                          </span>
                          {shelter.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              認証済
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 truncate">{shelter.name}</h2>
                        {shelter.address && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <svg className="w-4 h-4 mr-1 text-[#FF8C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{shelter.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {shelter.description && (
                      <p className="mt-4 text-sm text-gray-600 line-clamp-2">{shelter.description}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        登録: {new Date(shelter.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <span className="text-sm text-[#FF8C00] font-medium flex items-center">
                        詳細を見る
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  前へ
                </button>
                <span className="text-gray-600 px-4">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
