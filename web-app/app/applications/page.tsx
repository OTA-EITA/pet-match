'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Application {
  id: string;
  catId: string;
  catName: string;
  catBreed: string;
  status: 'pending' | 'approved' | 'rejected' | 'interviewing';
  appliedDate: string;
  message: string;
}

const statusConfig = {
  pending: { label: '審査中', color: 'bg-highlight-400 text-highlight-900', icon: '⏳' },
  approved: { label: '承認済み', color: 'bg-secondary-200 text-secondary-900', icon: '✅' },
  rejected: { label: '見送り', color: 'bg-neutral-300 text-neutral-700', icon: '❌' },
  interviewing: { label: '面会予定', color: 'bg-accent-300 text-accent-900', icon: '📅' },
};

export default function ApplicationsPage() {
  const [applications] = useState<Application[]>([
    {
      id: '1',
      catId: '1',
      catName: 'みけ',
      catBreed: '三毛猫',
      status: 'interviewing',
      appliedDate: '2024-11-10',
      message: '面会日程を調整中です',
    },
    {
      id: '2',
      catId: '2',
      catName: 'クロ',
      catBreed: '黒猫',
      status: 'pending',
      appliedDate: '2024-11-12',
      message: '保護団体による審査中',
    },
  ]);

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            📋 応募状況
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">
            {applications.length}件の応募があります
          </p>
        </div>
      </div>

      {/* 応募一覧 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {applications.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              まだ応募していません
            </h2>
            <p className="text-neutral-600 mb-6">
              気になる猫を見つけたら、応募してみましょう
            </p>
            <Link
              href="/cats"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition touchable"
            >
              猫を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = statusConfig[app.status];
              return (
                <div key={app.id} className="card overflow-hidden">
                  {/* ステータスバー */}
                  <div className={`px-4 py-2 ${config.color} flex items-center justify-between`}>
                    <span className="text-sm font-bold flex items-center">
                      <span className="mr-2">{config.icon}</span>
                      {config.label}
                    </span>
                    <span className="text-xs">
                      応募日: {new Date(app.appliedDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>

                  {/* 内容 */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                      {/* 猫写真 */}
                      <Link
                        href={`/cats/${app.catId}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center hover:opacity-80 transition"
                      >
                        <span className="text-3xl sm:text-4xl">😺</span>
                      </Link>

                      {/* 情報 */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/cats/${app.catId}`}
                          className="text-lg sm:text-xl font-bold text-neutral-900 hover:text-primary-600 transition"
                        >
                          {app.catName}
                        </Link>
                        <p className="text-sm text-neutral-600 mb-3">{app.catBreed}</p>
                        
                        {/* メッセージ */}
                        <div className="bg-cream-100 rounded-xl p-3">
                          <p className="text-sm text-neutral-700 leading-relaxed">
                            {app.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/cats/${app.catId}`}
                        className="flex-1 text-center bg-white border-2 border-primary-500 text-primary-600 px-4 py-2.5 rounded-xl font-medium hover:bg-primary-50 transition touchable"
                      >
                        猫の詳細を見る
                      </Link>
                      {app.status === 'interviewing' && (
                        <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl font-bold transition touchable">
                          面会日程を確認
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
