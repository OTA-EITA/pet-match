'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { applicationApi, Application } from '@/lib/applicationApi';

const statusConfig = {
  pending: { label: '審査中', color: 'bg-highlight-400 text-highlight-900', icon: '⏳' },
  approved: { label: '承認済み', color: 'bg-secondary-200 text-secondary-900', icon: '✅' },
  rejected: { label: '見送り', color: 'bg-neutral-300 text-neutral-700', icon: '❌' },
  completed: { label: '完了', color: 'bg-accent-300 text-accent-900', icon: '🎉' },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const data = await applicationApi.getApplications();
      setApplications(data);
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

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
              応募はまだありません
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
            {applications.map((application) => (
              <div
                key={application.id}
                className="card p-6 hover:shadow-card-hover transition"
              >
                {/* ステータスバッジ */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${
                      statusConfig[application.status].color
                    }`}
                  >
                    {statusConfig[application.status].icon}{' '}
                    {statusConfig[application.status].label}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {formatDate(application.created_at)}
                  </span>
                </div>

                {/* ペット情報 */}
                <div className="mb-4">
                  <p className="text-sm text-neutral-600 mb-2">応募ID: {application.id}</p>
                  <p className="text-sm text-neutral-600">ペットID: {application.pet_id}</p>
                </div>

                {/* メッセージ */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">
                    応募メッセージ:
                  </h3>
                  <p className="text-neutral-700 bg-neutral-50 p-4 rounded-lg">
                    {application.message}
                  </p>
                </div>

                {/* アクション */}
                <div className="flex gap-3">
                  <Link
                    href={`/cats/${application.pet_id}`}
                    className="flex-1 text-center bg-white border-2 border-primary-500 text-primary-500 px-4 py-2 rounded-xl font-medium hover:bg-primary-50 transition touchable"
                  >
                    ペットを見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
