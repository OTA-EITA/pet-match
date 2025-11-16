'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  timestamp: string;
  catTags?: string[];
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'popular'>('timeline');

  // モックデータ
  const posts: Post[] = [
    {
      id: '1',
      userId: 'user1',
      userName: '猫好きさん',
      content: 'うちの子、今日も元気いっぱいです！🐱',
      likes: 24,
      comments: 5,
      timestamp: '2時間前',
      catTags: ['三毛猫', 'かわいい'],
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'ねこ太郎',
      content: '保護猫カフェに行ってきました。この子めちゃくちゃ懐いてくれた❤️',
      likes: 48,
      comments: 12,
      timestamp: '5時間前',
      catTags: ['保護猫', '里親募集'],
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'キャットラバー',
      content: '新しいキャットタワー買ったら、すぐに気に入ってくれました😊',
      likes: 36,
      comments: 8,
      timestamp: '1日前',
      catTags: ['キャットタワー'],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              💬 コミュニティ
            </h1>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-medium touchable transition-colors">
              ✏️ 投稿
            </button>
          </div>

          {/* タブ */}
          <div className="flex space-x-1 -mb-px">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 font-medium transition-colors touchable ${
                activeTab === 'timeline'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              タイムライン
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-4 py-3 font-medium transition-colors touchable ${
                activeTab === 'popular'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              人気
            </button>
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="card overflow-hidden">
              {/* ユーザー情報 */}
              <div className="flex items-center space-x-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {post.userName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">{post.userName}</div>
                  <div className="text-xs text-neutral-500">{post.timestamp}</div>
                </div>
                <button className="text-neutral-400 hover:text-neutral-600 touchable p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              {/* 投稿内容 */}
              <div className="px-4 pb-3">
                <p className="text-neutral-900 leading-relaxed">{post.content}</p>
              </div>

              {/* タグ */}
              {post.catTags && post.catTags.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {post.catTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-lg font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 画像（モック） */}
              <div className="aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                <div className="text-8xl">😺</div>
              </div>

              {/* アクション */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
                <button className="flex items-center space-x-2 text-neutral-600 hover:text-accent-500 transition touchable">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">{post.likes}</span>
                </button>

                <button className="flex items-center space-x-2 text-neutral-600 hover:text-primary-500 transition touchable">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium">{post.comments}</span>
                </button>

                <button className="text-neutral-600 hover:text-neutral-900 transition touchable">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* フローティング投稿ボタン（スマホ） */}
      <button className="fixed bottom-20 right-4 sm:hidden bg-primary-500 hover:bg-primary-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center touchable z-30 transition-all hover:scale-110">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
