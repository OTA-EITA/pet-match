'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCatPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    gender: 'male',
    description: '',
    personality: [] as string[],
    location: '',
    healthInfo: '',
  });

  const personalityOptions = [
    '人懐っこい', '甘えん坊', 'おとなしい', '活発', '好奇心旺盛',
    '穏やか', '独立心強い', '遊び好き', '賢い', 'おっとり',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePersonality = (trait: string) => {
    setFormData({
      ...formData,
      personality: formData.personality.includes(trait)
        ? formData.personality.filter(t => t !== trait)
        : [...formData.personality, trait]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API連携
    console.log('Submit:', formData);
    router.push('/cats');
  };

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            🐱 猫を登録
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">
            新しい家族を探している猫の情報を登録しましょう
          </p>
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* 写真アップロード */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">写真</h2>
            <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-12 text-center hover:border-primary-400 transition cursor-pointer">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-neutral-600 mb-2">写真をアップロード</p>
              <p className="text-sm text-neutral-500">クリックまたはドラッグ&ドロップ</p>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="例: たま"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    種類 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="例: 三毛猫"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    年齢 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="例: 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  性別 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>オス ♂</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>メス ♀</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  地域 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="例: 東京都渋谷区"
                />
              </div>
            </div>
          </div>

          {/* 性格 */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">性格</h2>
            <div className="flex flex-wrap gap-2">
              {personalityOptions.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => togglePersonality(trait)}
                  className={`px-4 py-2 rounded-xl font-medium transition touchable ${
                    formData.personality.includes(trait)
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>

          {/* 紹介文 */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">紹介文</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition resize-none"
              placeholder="この子の魅力や特徴を教えてください"
            />
          </div>

          {/* 健康情報 */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">健康情報</h2>
            <textarea
              name="healthInfo"
              value={formData.healthInfo}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition resize-none"
              placeholder="ワクチン接種状況、去勢/避妊手術、健康状態など"
            />
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-xl font-bold transition touchable shadow-md"
            >
              登録する
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-white border-2 border-neutral-300 text-neutral-700 py-4 rounded-xl font-medium hover:bg-neutral-50 transition touchable"
            >
              キャンセル
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
