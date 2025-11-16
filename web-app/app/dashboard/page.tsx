'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  // モックデータ
  const stats = {
    favorites: 5,
    applications: 2,
    posts: 12,
  };

  const recentActivity = [
    { id: '1', type: 'favorite', text: '「みけ」をお気に入りに追加しました', time: '2時間前' },
    { id: '2', type: 'application', text: '「クロ」に応募しました', time: '1日前' },
    { id: '3', type: 'post', text: 'コミュニティに投稿しました', time: '2日前' },
  ];

  const quickLinks = user?.type === 'shelter' 
    ? [
        { icon: '➕', label: '猫を登録', href: '/cats/new', color: 'from-primary-400 to-primary-600' },
        { icon: '📋', label: '掲載中の猫', href: '/my-cats', color: 'from-secondary-400 to-secondary-600' },
        { icon: '📧', label: '応募一覧', href: '/applications', color: 'from-accent-400 to-accent-600' },
        { icon: '📊', label: '統計', href: '/stats', color: 'from-highlight-400 to-highlight-600' },
      ]
    : [
        { icon: '🔍', label: '猫を探す', href: '/cats', color: 'from-primary-400 to-primary-600' },
        { icon: '❤️', label: 'お気に入り', href: '/favorites', color: 'from-accent-400 to-accent-600' },
        { icon: '📋', label: '応募状況', href: '/applications', color: 'from-secondary-400 to-secondary-600' },
        { icon: '💬', label: 'コミュニティ', href: '/community', color: 'from-highlight-400 to-highlight-600' },
      ];

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-primary-400 to-accent-300 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl sm:text-4xl">
                {user?.name?.charAt(0).toUpperCase() || '🐱'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                おかえりなさい、{user?.name}さん
              </h1>
              <p className="text-primary-50 text-sm sm:text-base">
                {user?.type === 'shelter' ? '保護団体ダッシュボード' : 'マイページ'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Link href="/favorites" className="card p-4 sm:p-6 text-center hover:shadow-card-hover transition touchable">
            <div className="text-3xl sm:text-4xl font-bold text-accent-600 mb-1 sm:mb-2">
              {stats.favorites}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">お気に入り</div>
          </Link>
          <Link href="/applications" className="card p-4 sm:p-6 text-center hover:shadow-card-hover transition touchable">
            <div className="text-3xl sm:text-4xl font-bold text-secondary-600 mb-1 sm:mb-2">
              {stats.applications}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">応募中</div>
          </Link>
          <Link href="/community" className="card p-4 sm:p-6 text-center hover:shadow-card-hover transition touchable">
            <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-1 sm:mb-2">
              {stats.posts}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">投稿</div>
          </Link>
        </div>

        {/* クイックリンク */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">クイックアクセス</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card p-6 text-center hover:shadow-card-hover transition-all touchable group"
              >
                <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${link.color} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{link.icon}</span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-neutral-900">
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 最近の活動 */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">最近の活動</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-xl hover:bg-cream-100 transition"
                  >
                    <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {activity.type === 'favorite' && '❤️'}
                        {activity.type === 'application' && '📋'}
                        {activity.type === 'post' && '💬'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900">{activity.text}</p>
                      <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* サイドメニュー */}
          <div className="space-y-4">
            {/* プロフィール */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">プロフィール</h3>
              <Link
                href="/profile"
                className="block text-center bg-white border-2 border-primary-500 text-primary-600 py-3 rounded-xl font-medium hover:bg-primary-50 transition touchable"
              >
                プロフィールを見る
              </Link>
            </div>

            {/* おすすめ */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">おすすめ</h3>
              <div className="space-y-3">
                <Link
                  href="/portal"
                  className="block p-3 rounded-xl hover:bg-cream-100 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📚</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900">猫図鑑</div>
                      <div className="text-xs text-neutral-500">飼育ガイドを読む</div>
                    </div>
                  </div>
                </Link>
                <Link
                  href="/community"
                  className="block p-3 rounded-xl hover:bg-cream-100 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💬</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900">コミュニティ</div>
                      <div className="text-xs text-neutral-500">猫好きと交流</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* お知らせ */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">お知らせ</h3>
              <div className="space-y-3">
                <div className="p-3 bg-highlight-100 rounded-xl">
                  <p className="text-xs text-neutral-700">
                    新機能：推し猫機能が追加されました！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
