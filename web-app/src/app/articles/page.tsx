'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { articlesApi, Article, ArticleCategory, articleCategoryNames } from '@/lib/api';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | ''>('');
  const limit = 12;

  useEffect(() => {
    fetchArticles();
  }, [page, selectedCategory]);

  const fetchArticles = async () => {
    setIsLoading(true);
    setError('');

    const result = await articlesApi.getAll({
      category: selectedCategory || undefined,
      limit,
      offset: page * limit,
    });

    if (result.data) {
      setArticles(result.data.articles || []);
      setTotal(result.data.total || 0);
    } else {
      setError(result.error || '記事の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  const categories: (ArticleCategory | '')[] = ['', 'adoption', 'health', 'nutrition', 'behavior', 'grooming', 'lifestyle', 'story', 'news'];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">猫コラム</h1>
          <p className="text-gray-600">猫との暮らしに役立つ情報をお届けします</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category || 'all'}
                onClick={() => {
                  setSelectedCategory(category);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#FF8C00] text-white'
                    : 'bg-white text-gray-600 hover:bg-[#FFF5E6] border border-gray-200'
                }`}
              >
                {category ? articleCategoryNames[category] : 'すべて'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchArticles}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
            >
              再試行
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#FFF5E6] flex items-center justify-center">
              <svg className="w-12 h-12 text-[#FF8C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
              </svg>
            </div>
            <p className="text-gray-500">記事がまだありません</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug || article.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-video bg-[#FFF5E6]">
                    {article.cover_image ? (
                      <Image
                        src={article.cover_image}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/cat-logo.png" alt="" width={60} height={60} className="opacity-50" />
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 bg-[#FF8C00] text-white text-xs font-bold px-3 py-1 rounded-full">
                      {articleCategoryNames[article.category]}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h2 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{article.title}</h2>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(article.published_at)}</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {article.view_count}
                      </span>
                    </div>
                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-[#FFF5E6] text-[#D97706] px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  前へ
                </button>
                <span className="text-gray-600 px-4">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
