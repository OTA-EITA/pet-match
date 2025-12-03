'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { usersApi, PublicProfile, Pet, reviewsApi, Review, ReviewSummary } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function ShelterDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    const [profileResult, petsResult, reviewsResult, summaryResult] = await Promise.all([
      usersApi.getPublicProfile(resolvedParams.id),
      usersApi.getUserPets(resolvedParams.id),
      reviewsApi.getByTarget(resolvedParams.id),
      reviewsApi.getSummary(resolvedParams.id),
    ]);

    if (profileResult.data?.profile) {
      setProfile(profileResult.data.profile);
    } else {
      setError(profileResult.error || 'プロフィールの取得に失敗しました');
    }

    if (petsResult.data?.pets) {
      setPets(petsResult.data.pets);
    }

    if (reviewsResult.data?.reviews) {
      setReviews(reviewsResult.data.reviews);
    }

    if (summaryResult.data?.summary) {
      setReviewSummary(summaryResult.data.summary);
    }

    setIsLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated || !user) return;

    setIsSubmittingReview(true);
    const result = await reviewsApi.create({
      target_id: resolvedParams.id,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
    });

    if (result.data?.review) {
      setReviews([result.data.review, ...reviews]);
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', content: '' });
      // Refresh summary
      const summaryResult = await reviewsApi.getSummary(resolvedParams.id);
      if (summaryResult.data?.summary) {
        setReviewSummary(summaryResult.data.summary);
      }
    }
    setIsSubmittingReview(false);
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate && onRate(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error || 'プロフィールが見つかりませんでした'}</p>
          <Link href="/pets" className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors">
            猫ちゃん一覧へ
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

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Profile Image */}
            <div className="md:w-1/3 bg-[#FFF5E6]">
              <div className="relative aspect-square">
                {profile.profile_image ? (
                  <Image
                    src={profile.profile_image}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-[#FFD9B3] flex items-center justify-center">
                      <span className="text-6xl text-[#FF8C00]">
                        {profile.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="md:w-2/3 p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#FFF5E6] text-[#D97706] px-3 py-1 rounded-full text-sm border border-[#FFD9B3]">
                      {getUserTypeLabel(profile.type)}
                    </span>
                    {profile.verified && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        認証済み
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
                </div>
              </div>

              {/* Address */}
              {profile.address && (
                <div className="flex items-center text-gray-600 mb-4">
                  <svg className="w-5 h-5 mr-2 text-[#FF8C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.address}
                </div>
              )}

              {/* Website */}
              {profile.website && (
                <div className="flex items-center text-gray-600 mb-4">
                  <svg className="w-5 h-5 mr-2 text-[#FF8C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF8C00] hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}

              {/* Description */}
              {profile.description && (
                <div className="mt-6">
                  <h2 className="text-sm text-gray-500 mb-2">紹介</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
                </div>
              )}

              {/* Member since */}
              <div className="mt-6 text-sm text-gray-500">
                登録日: {new Date(profile.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>
        </div>

        {/* Pets Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            取り扱い猫ちゃん
            <span className="ml-2 text-lg font-normal text-gray-500">({pets.length}匹)</span>
          </h2>

          {pets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pets.map((pet) => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square bg-[#FFF5E6]">
                    {pet.images && pet.images.length > 0 ? (
                      <Image
                        src={pet.images[0]}
                        alt={pet.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/cat-logo.png" alt="No image" width={60} height={60} className="opacity-50" />
                      </div>
                    )}
                    {/* Status badge */}
                    <div className={`absolute top-2 left-2 text-xs text-white font-bold px-2 py-1 rounded ${
                      pet.status === 'available' ? 'bg-[#FF8C00]' :
                      pet.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}>
                      {pet.status === 'available' ? '募集中' :
                       pet.status === 'pending' ? '交渉中' : '決定'}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800 truncate">{pet.name}</h3>
                      <span className={`text-lg ${pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                        {pet.gender === 'male' ? '♂' : '♀'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{pet.breed}</p>
                    <p className="text-sm text-gray-500">{pet.age_info?.age_text || `${pet.age_months}ヶ月`}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              現在、募集中の猫ちゃんはいません
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              レビュー
              {reviewSummary && reviewSummary.total_reviews > 0 && (
                <span className="ml-2 text-lg font-normal text-gray-500">
                  ({reviewSummary.total_reviews}件)
                </span>
              )}
            </h2>
            {isAuthenticated && user?.id !== resolvedParams.id && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
              >
                レビューを書く
              </button>
            )}
          </div>

          {/* Review Summary */}
          {reviewSummary && reviewSummary.total_reviews > 0 && (
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800">
                    {reviewSummary.average_rating.toFixed(1)}
                  </div>
                  <div className="mt-1">{renderStars(Math.round(reviewSummary.average_rating))}</div>
                  <div className="text-sm text-gray-500 mt-1">{reviewSummary.total_reviews}件のレビュー</div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-600 w-4">{star}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{
                            width: `${reviewSummary.total_reviews > 0
                              ? ((reviewSummary.rating_counts[star] || 0) / reviewSummary.total_reviews) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">
                        {reviewSummary.rating_counts[star] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">レビューを投稿</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">評価</label>
                  {renderStars(newReview.rating, true, (r) => setNewReview({ ...newReview, rating: r }))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="レビューのタイトル"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                  <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="レビューの内容を入力..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReview ? '投稿中...' : '投稿する'}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {renderStars(review.rating)}
                      {review.title && (
                        <h4 className="font-bold text-gray-800 mt-2">{review.title}</h4>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                  </div>
                  {review.content && (
                    <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
                  )}
                  {review.response && (
                    <div className="mt-4 pl-4 border-l-2 border-[#FF8C00] bg-orange-50 p-3 rounded-r-lg">
                      <div className="text-sm font-medium text-[#FF8C00] mb-1">シェルターからの返信</div>
                      <p className="text-gray-700 text-sm">{review.response}</p>
                      {review.responded_at && (
                        <span className="text-xs text-gray-500 mt-1 block">{formatDate(review.responded_at)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              まだレビューはありません
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ShelterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ShelterDetailContent params={params} />;
}
