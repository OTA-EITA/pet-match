'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { petsApi, Pet } from '@/lib/api';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function PetDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { isAuthenticated } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchPet();
  }, [resolvedParams.id]);

  const fetchPet = async () => {
    setIsLoading(true);
    setError('');

    const result = await petsApi.getById(resolvedParams.id);

    if (result.data) {
      setPet(result.data);
    } else {
      setError(result.error || '猫ちゃん情報の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-[#FF8C00]';
      case 'pending':
        return 'bg-yellow-500';
      case 'adopted':
        return 'bg-gray-400';
      default:
        return 'bg-[#FF8C00]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '募集中';
      case 'pending':
        return '交渉中';
      case 'adopted':
        return '決定';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error || '猫ちゃんが見つかりませんでした'}</p>
          <Link href="/pets" className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/pets" className="inline-flex items-center text-gray-600 hover:text-[#FF8C00] mb-6 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Images */}
            <div className="md:w-1/2">
              <div className="relative aspect-square bg-[#FFF5E6]">
                {pet.images && pet.images.length > 0 ? (
                  <Image
                    src={pet.images[selectedImage]}
                    alt={pet.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image src="/cat-logo.png" alt="No image" width={120} height={120} className="opacity-50" />
                  </div>
                )}
                {/* Status badge */}
                <div className={`absolute top-4 left-4 ${getStatusColor(pet.status)} text-white font-bold px-4 py-2 rounded-lg`}>
                  {getStatusText(pet.status)}
                </div>
              </div>
              {/* Thumbnail gallery */}
              {pet.images && pet.images.length > 1 && (
                <div className="flex gap-2 p-4">
                  {pet.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-[#FF8C00]' : 'border-transparent'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:w-1/2 p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-800">{pet.name}</h1>
                <span className={`text-3xl font-bold ${pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                  {pet.gender === 'male' ? '♂' : '♀'}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#FFF5E6] p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">品種</p>
                  <p className="font-semibold text-gray-800">{pet.breed}</p>
                </div>
                <div className="bg-[#FFF5E6] p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">年齢</p>
                  <p className="font-semibold text-gray-800">{pet.age_info?.age_text || `${pet.age_months}ヶ月`}</p>
                </div>
                {pet.weight && pet.weight > 0 && (
                  <div className="bg-[#FFF5E6] p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">体重</p>
                    <p className="font-semibold text-gray-800">{pet.weight}kg</p>
                  </div>
                )}
                <div className="bg-[#FFF5E6] p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">サイズ</p>
                  <p className="font-semibold text-gray-800">
                    {pet.size === 'small' ? '小型' : pet.size === 'medium' ? '中型' : '大型'}
                  </p>
                </div>
              </div>

              {/* Personality */}
              {pet.personality && pet.personality.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">性格</p>
                  <div className="flex flex-wrap gap-2">
                    {pet.personality.map((trait, index) => (
                      <span
                        key={index}
                        className="bg-[#FFF5E6] text-[#D97706] px-3 py-1 rounded-full border border-[#FFD9B3]"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical info */}
              {pet.medical_info && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">医療情報</p>
                  <div className="flex gap-3">
                    <span className={`px-3 py-1 rounded-lg ${pet.medical_info.vaccinated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      ワクチン{pet.medical_info.vaccinated ? '済' : '未'}
                    </span>
                    <span className={`px-3 py-1 rounded-lg ${pet.medical_info.neutered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      避妊去勢{pet.medical_info.neutered ? '済' : '未'}
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {pet.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">紹介</p>
                  <p className="text-gray-700 leading-relaxed">{pet.description}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                {pet.status === 'available' && (
                  isAuthenticated ? (
                    <button className="w-full bg-[#FF8C00] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E67E00] transition-colors shadow-md">
                      問い合わせる
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full text-center bg-[#FF8C00] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E67E00] transition-colors shadow-md"
                    >
                      ログインして問い合わせる
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthProvider>
      <PetDetailContent params={params} />
    </AuthProvider>
  );
}
