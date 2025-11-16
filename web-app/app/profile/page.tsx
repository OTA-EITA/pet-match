'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: '猫が大好きです！',
    location: '東京都',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // TODO: API連携
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-primary-400 to-accent-300 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* アバター */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-5xl sm:text-6xl">
                {user?.name?.charAt(0).toUpperCase() || '🐱'}
              </span>
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{user?.name}</h1>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-3">
                {user?.type === 'shelter' ? '🏢 保護団体' : '🏠 里親希望'}
              </div>
              <p className="text-primary-50">{formData.location}</p>
            </div>

            {/* 編集ボタン */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white text-primary-600 px-6 py-2 rounded-xl font-medium hover:bg-primary-50 transition touchable"
              >
                編集
              </button>
            )}
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isEditing ? (
          /* 編集モード */
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">プロフィール編集</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  自己紹介
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  地域
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold transition touchable"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white border-2 border-neutral-300 text-neutral-700 py-3 rounded-xl font-medium hover:bg-neutral-50 transition touchable"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 表示モード */
          <div className="space-y-6">
            {/* 自己紹介 */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">自己紹介</h2>
              <p className="text-neutral-700 leading-relaxed">{formData.bio}</p>
            </div>

            {/* 統計 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1">5</div>
                <div className="text-sm text-neutral-600">お気に入り</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-secondary-600 mb-1">2</div>
                <div className="text-sm text-neutral-600">応募中</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-accent-600 mb-1">12</div>
                <div className="text-sm text-neutral-600">投稿</div>
              </div>
            </div>

            {/* 推し猫（将来的に） */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">推し猫</h2>
              <div className="text-center py-8 text-neutral-500">
                <div className="text-5xl mb-3">😺</div>
                <p>推し猫を設定しましょう</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
