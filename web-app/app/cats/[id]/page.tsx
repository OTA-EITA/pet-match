'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CatDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // TODO: APIから取得
  const cat = {
    id,
    name: 'みけ',
    breed: '三毛猫',
    age: 2,
    gender: 'female',
    description: '人懐っこくて甘えん坊な女の子です。初めての方にもおすすめです。',
    personality: ['人懐っこい', '甘えん坊', 'おとなしい'],
    location: '東京都',
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* 戻るボタン */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/cats"
            className="inline-flex items-center text-neutral-600 hover:text-primary-600 transition touchable"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 猫写真 */}
        <div className="card mb-6 overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
            <div className="text-9xl">😺</div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="card p-6 mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            {cat.name}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-neutral-600 mb-1">種類</div>
              <div className="font-medium text-neutral-900">{cat.breed}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 mb-1">年齢</div>
              <div className="font-medium text-neutral-900">{cat.age}歳</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 mb-1">性別</div>
              <div className="font-medium text-neutral-900">
                {cat.gender === 'male' ? 'オス ♂' : 'メス ♀'}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 mb-1">地域</div>
              <div className="font-medium text-neutral-900">{cat.location}</div>
            </div>
          </div>

          {/* 性格 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">性格</h3>
            <div className="flex flex-wrap gap-2">
              {cat.personality.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 説明 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">紹介</h3>
            <p className="text-neutral-700 leading-relaxed">{cat.description}</p>
          </div>
        </div>

        {/* 応募ボタン（固定フッター スマホ） */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 sm:hidden safe-area-padding-bottom z-30">
          <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg touchable transition-colors">
            この子に応募する
          </button>
        </div>

        {/* 応募ボタン（PC） */}
        <div className="hidden sm:block">
          <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg transition-colors">
            この子に応募する
          </button>
        </div>
      </div>
    </div>
  );
}
