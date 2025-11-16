'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BreedDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // TODO: APIから取得
  const breed = {
    id,
    name: 'アメリカンショートヘア',
    nameEn: 'American Shorthair',
    origin: 'アメリカ',
    description: 'アメリカンショートヘアは、丈夫で人懐っこく、家族向けの猫として人気があります。活発で遊び好きな性格で、子供や他のペットとも仲良くできます。',
    characteristics: ['社交的', '遊び好き', '丈夫', '賢い', '適応力が高い'],
    size: '中〜大型',
    weight: '3.5〜7kg',
    lifespan: '15〜20年',
    coat: '短毛',
    colors: ['シルバー', 'ブラウン', 'ブルー', 'レッド', 'クリーム'],
    care: {
      grooming: '週1〜2回のブラッシングで十分',
      exercise: '活発なので毎日の遊び時間が必要',
      diet: '栄養バランスの取れた食事を適量与える',
    },
    health: '一般的に健康な品種ですが、肥満に注意が必要です。定期的な健康診断をおすすめします。',
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/portal"
            className="inline-flex items-center text-neutral-600 hover:text-primary-600 transition touchable"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            猫図鑑に戻る
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* メイン画像 */}
        <div className="card mb-6 overflow-hidden">
          <div className="aspect-[16/9] bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
            <div className="text-9xl">😺</div>
          </div>
        </div>

        {/* タイトル */}
        <div className="card p-6 sm:p-8 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            {breed.name}
          </h1>
          <p className="text-lg text-neutral-600 mb-4">{breed.nameEn}</p>
          <div className="flex items-center text-neutral-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            原産地: {breed.origin}
          </div>
        </div>

        {/* 説明 */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">特徴</h2>
          <p className="text-neutral-700 leading-relaxed mb-6">{breed.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {breed.characteristics.map((char) => (
              <span
                key={char}
                className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* 基本情報 */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">基本情報</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="w-24 text-sm font-medium text-neutral-600">体格</div>
              <div className="flex-1 text-neutral-900">{breed.size}</div>
            </div>
            <div className="flex items-start">
              <div className="w-24 text-sm font-medium text-neutral-600">体重</div>
              <div className="flex-1 text-neutral-900">{breed.weight}</div>
            </div>
            <div className="flex items-start">
              <div className="w-24 text-sm font-medium text-neutral-600">寿命</div>
              <div className="flex-1 text-neutral-900">{breed.lifespan}</div>
            </div>
            <div className="flex items-start">
              <div className="w-24 text-sm font-medium text-neutral-600">被毛</div>
              <div className="flex-1 text-neutral-900">{breed.coat}</div>
            </div>
          </div>
        </div>

        {/* お世話のポイント */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">お世話のポイント</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">🪮 グルーミング</h3>
              <p className="text-neutral-700">{breed.care.grooming}</p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">🎾 運動</h3>
              <p className="text-neutral-700">{breed.care.exercise}</p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">🍖 食事</h3>
              <p className="text-neutral-700">{breed.care.diet}</p>
            </div>
          </div>
        </div>

        {/* 健康 */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">健康について</h2>
          <p className="text-neutral-700 leading-relaxed">{breed.health}</p>
        </div>
      </div>
    </div>
  );
}
