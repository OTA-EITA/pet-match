'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { petsApi, Pet, inquiriesApi, favoritesApi, CreateInquiryData } from '@/lib/api';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function PetDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, isAuthenticated } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  // Inquiry form state
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryData, setInquiryData] = useState<Omit<CreateInquiryData, 'pet_id'>>({
    message: '',
    type: 'question',
    contact_method: 'email',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchPet();
    if (isAuthenticated) {
      checkFavoriteStatus();
    }
  }, [resolvedParams.id, isAuthenticated]);

  const fetchPet = async () => {
    setIsLoading(true);
    setError('');

    const result = await petsApi.getById(resolvedParams.id);

    if (result.data) {
      setPet(result.data);
      // 閲覧履歴を保存
      saveToHistory(result.data);
    } else {
      setError(result.error || '猫ちゃん情報の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const saveToHistory = (petData: Pet) => {
    try {
      const historyKey = 'pet_view_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      // 重複を削除して先頭に追加
      const filtered = history.filter((h: { id: string }) => h.id !== petData.id);
      const newHistory = [
        { id: petData.id, name: petData.name, breed: petData.breed, image: petData.images?.[0], viewedAt: new Date().toISOString() },
        ...filtered
      ].slice(0, 20); // 最大20件
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
    } catch {
      // localStorage error - ignore
    }
  };

  const checkFavoriteStatus = async () => {
    const result = await favoritesApi.isFavorited(resolvedParams.id);
    setIsFavorited(result);
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) return;

    setFavoriteLoading(true);
    if (isFavorited) {
      await favoritesApi.remove(resolvedParams.id);
      setIsFavorited(false);
    } else {
      await favoritesApi.add(resolvedParams.id);
      setIsFavorited(true);
    }
    setFavoriteLoading(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError('');

    if (!inquiryData.message.trim()) {
      setInquiryError('メッセージを入力してください');
      return;
    }

    if (inquiryData.contact_method === 'phone' && !inquiryData.phone?.trim()) {
      setInquiryError('電話番号を入力してください');
      return;
    }

    setIsSubmitting(true);
    const result = await inquiriesApi.create({
      pet_id: resolvedParams.id,
      ...inquiryData,
    });
    setIsSubmitting(false);

    if (result.data) {
      setInquirySuccess(true);
      setShowInquiryForm(false);
      setInquiryData({ message: '', type: 'question', contact_method: 'email', phone: '' });
    } else {
      setInquiryError(result.error || '送信に失敗しました');
    }
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

  const isNewPet = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
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

        {/* Success message */}
        {inquirySuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            問い合わせを送信しました。返信をお待ちください。
          </div>
        )}

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
                {/* Favorite button */}
                {isAuthenticated && (
                  <button
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <svg
                      className={`w-6 h-6 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                      fill={isFavorited ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
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
                {pet.location && (
                  <div className="bg-[#FFF5E6] p-4 rounded-lg col-span-2">
                    <p className="text-sm text-gray-500 mb-1">所在地</p>
                    <p className="font-semibold text-gray-800">{pet.location}</p>
                  </div>
                )}
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
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{pet.description}</p>
                </div>
              )}

              {/* Registration date */}
              {pet.created_at && (
                <div className="mb-6 text-sm text-gray-500">
                  登録日: {new Date(pet.created_at).toLocaleDateString('ja-JP')}
                  {isNewPet(pet.created_at) && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                {pet.status === 'available' && (
                  isAuthenticated ? (
                    user?.type !== 'shelter' ? (
                      <button
                        onClick={() => setShowInquiryForm(!showInquiryForm)}
                        className="w-full bg-[#FF8C00] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E67E00] transition-colors shadow-md"
                      >
                        {showInquiryForm ? '閉じる' : '問い合わせる'}
                      </button>
                    ) : null
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

          {/* Inquiry Form */}
          {showInquiryForm && (
            <div className="border-t border-gray-100 p-6 md:p-8 bg-[#FFF9F0]">
              <h2 className="text-xl font-bold text-gray-800 mb-4">問い合わせフォーム</h2>
              <form onSubmit={handleInquirySubmit}>
                {inquiryError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                    {inquiryError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    問い合わせ種類
                  </label>
                  <select
                    value={inquiryData.type}
                    onChange={(e) => setInquiryData({ ...inquiryData, type: e.target.value as CreateInquiryData['type'] })}
                    className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                    disabled={isSubmitting}
                  >
                    <option value="question">質問</option>
                    <option value="interview">面談希望</option>
                    <option value="adoption">譲渡希望</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メッセージ *
                  </label>
                  <textarea
                    value={inquiryData.message}
                    onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                    rows={4}
                    placeholder="ご質問やご希望をお書きください"
                    className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    希望連絡方法
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contact_method"
                        value="email"
                        checked={inquiryData.contact_method === 'email'}
                        onChange={(e) => setInquiryData({ ...inquiryData, contact_method: e.target.value as 'email' | 'phone' })}
                        className="mr-2"
                        disabled={isSubmitting}
                      />
                      メール
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contact_method"
                        value="phone"
                        checked={inquiryData.contact_method === 'phone'}
                        onChange={(e) => setInquiryData({ ...inquiryData, contact_method: e.target.value as 'email' | 'phone' })}
                        className="mr-2"
                        disabled={isSubmitting}
                      />
                      電話
                    </label>
                  </div>
                </div>

                {inquiryData.contact_method === 'phone' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号 *
                    </label>
                    <input
                      type="tel"
                      value={inquiryData.phone}
                      onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                      placeholder="090-1234-5678"
                      className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF8C00] text-white py-3 rounded-xl font-bold hover:bg-[#E67E00] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? '送信中...' : '送信する'}
                </button>
              </form>
            </div>
          )}
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
