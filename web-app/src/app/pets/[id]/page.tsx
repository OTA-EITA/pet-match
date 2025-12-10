'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import { petsApi, Pet, inquiriesApi, favoritesApi, reportsApi, recommendationsApi, CreateInquiryData, ReportReason } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('inappropriate');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');

  // Similar pets state
  const [similarPets, setSimilarPets] = useState<Pet[]>([]);
  const [similarPetsLoading, setSimilarPetsLoading] = useState(false);

  useEffect(() => {
    fetchPet();
    fetchSimilarPets();
    if (isAuthenticated) {
      checkFavoriteStatus();
    }
  }, [resolvedParams.id, isAuthenticated]);

  // Update document title when pet data loads
  useEffect(() => {
    if (pet) {
      document.title = `${pet.name}（${pet.breed}）| OnlyCats`;
    }
    return () => {
      document.title = "OnlyCats - 猫との素敵な出会いを";
    };
  }, [pet]);

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

  const fetchSimilarPets = async () => {
    setSimilarPetsLoading(true);
    const result = await recommendationsApi.getSimilar(resolvedParams.id, 6);
    if (result.data?.pets) {
      setSimilarPets(result.data.pets);
    }
    setSimilarPetsLoading(false);
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');
    setIsReporting(true);

    const result = await reportsApi.create({
      target_type: 'pet',
      target_id: resolvedParams.id,
      reason: reportReason,
      description: reportDescription,
    });
    setIsReporting(false);

    if (result.data) {
      setReportSuccess(true);
      setShowReportModal(false);
      setReportReason('inappropriate');
      setReportDescription('');
    } else {
      setReportError(result.error || '送信に失敗しました');
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

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pet.name,
    description: pet.description || `${pet.breed}の${pet.gender === 'male' ? 'オス' : 'メス'}、${pet.age_info?.age_text || '年齢不明'}`,
    image: pet.images?.[0] || "/cat-logo.png",
    category: "Pet",
    brand: {
      "@type": "Organization",
      name: "OnlyCats",
    },
    offers: {
      "@type": "Offer",
      availability: pet.status === "available"
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      price: "0",
      priceCurrency: "JPY",
    },
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Script
        id="json-ld-pet"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

              {/* Share buttons */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">この猫をシェア</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
                      const text = encodeURIComponent(`${pet.name}（${pet.breed}）が里親を募集しています`);
                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
                      const text = encodeURIComponent(`${pet.name}（${pet.breed}）が里親を募集しています`);
                      window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank');
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-[#00B900] text-white rounded-lg hover:bg-[#00A000] transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 5.58 2 10c0 3.92 3.78 7.21 8.86 7.9.33.07.77.22.88.5.1.26.07.67.03.93l-.14.83c-.04.26-.2 1.01.89.55 1.09-.46 5.89-3.47 8.03-5.94C22.08 12.02 22 11.04 22 10c0-4.42-4.48-8-10-8zm-.71 11h-1.58v-4h1.58v4zm3.54 0h-1.58V9.73L11.88 13h-.06l-1.37-3.27V13H9.03V9h1.58l1.19 2.81L13.03 9h1.58v4z" />
                    </svg>
                    LINE
                  </button>
                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert('URLをコピーしました');
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    URL
                  </button>
                </div>
              </div>

              {/* Shelter link */}
              {pet.owner_id && (
                <div className="mb-6">
                  <Link
                    href={`/shelters/${pet.owner_id}`}
                    className="inline-flex items-center text-[#FF8C00] hover:underline"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    掲載元のプロフィールを見る
                  </Link>
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
                {/* Report button */}
                {isAuthenticated && pet.owner_id !== user?.id && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full text-gray-500 hover:text-red-500 py-2 text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    この掲載を通報する
                  </button>
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

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">この掲載を通報</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleReportSubmit}>
                {reportError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                    {reportError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通報理由 *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={isReporting}
                  >
                    <option value="inappropriate">不適切なコンテンツ</option>
                    <option value="fraud">詐欺・なりすまし</option>
                    <option value="misleading">虚偽・誤解を招く情報</option>
                    <option value="animal_abuse">動物虐待の疑い</option>
                    <option value="spam">スパム・宣伝</option>
                    <option value="harassment">嫌がらせ</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    詳細説明（任意）
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={4}
                    placeholder="問題の詳細をお書きください"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={isReporting}
                  />
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p>通報内容は運営チームが確認し、適切な対応を行います。虚偽の通報は利用規約違反となります。</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                    disabled={isReporting}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isReporting}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {isReporting ? '送信中...' : '通報する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Success Toast */}
        {reportSuccess && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            通報を受け付けました。ご協力ありがとうございます。
          </div>
        )}

        {/* Similar Pets Section */}
        {!similarPetsLoading && similarPets.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">この子に似た猫</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarPets.map((similarPet) => (
                <Link
                  key={similarPet.id}
                  href={`/pets/${similarPet.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square bg-[#FFF5E6]">
                    {similarPet.images && similarPet.images.length > 0 ? (
                      <Image
                        src={similarPet.images[0]}
                        alt={similarPet.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/cat-logo.png" alt="" width={40} height={40} className="opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 truncate">{similarPet.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{similarPet.breed}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {similarPet.age_info?.age_text || `${similarPet.age_months}ヶ月`}
                      <span className={`ml-1 ${similarPet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                        {similarPet.gender === 'male' ? '♂' : '♀'}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <PetDetailContent params={params} />;
}
