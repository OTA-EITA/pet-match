'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { articlesApi, Article, articleCategoryNames } from '@/lib/api';

function ArticleDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [resolvedParams.slug]);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | OnlyCats`;
    }
    return () => {
      document.title = "OnlyCats - 猫との素敵な出会いを";
    };
  }, [article]);

  const fetchArticle = async () => {
    setIsLoading(true);
    setError('');

    const result = await articlesApi.getByIdOrSlug(resolvedParams.slug);

    if (result.data?.article) {
      setArticle(result.data.article);
    } else {
      setError(result.error || '記事が見つかりませんでした');
    }
    setIsLoading(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error || '記事が見つかりませんでした'}</p>
          <Link href="/articles" className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors">
            コラム一覧へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/articles" className="inline-flex items-center text-gray-600 hover:text-[#FF8C00] mb-6 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          コラム一覧に戻る
        </Link>

        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cover Image */}
          {article.cover_image && (
            <div className="relative aspect-video bg-[#FFF5E6]">
              <Image
                src={article.cover_image}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-10">
            {/* Category & Date */}
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FF8C00] text-white text-sm font-bold px-3 py-1 rounded-full">
                {articleCategoryNames[article.category]}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(article.published_at)}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {article.view_count}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{article.title}</h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-lg text-gray-600 mb-8 border-l-4 border-[#FF8C00] pl-4 italic">
                {article.excerpt}
              </p>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-3">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm bg-[#FFF5E6] text-[#D97706] px-3 py-1 rounded-full border border-[#FFD9B3]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">この記事をシェア</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
                    const text = encodeURIComponent(article.title);
                    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </button>
                <button
                  onClick={() => {
                    const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  onClick={() => {
                    const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
                    const text = encodeURIComponent(article.title);
                    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank');
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-[#00B900] text-white rounded-lg hover:bg-[#00A000] transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 5.58 2 10c0 3.92 3.78 7.21 8.86 7.9.33.07.77.22.88.5.1.26.07.67.03.93l-.14.83c-.04.26-.2 1.01.89.55 1.09-.46 5.89-3.47 8.03-5.94C22.08 12.02 22 11.04 22 10c0-4.42-4.48-8-10-8z" />
                  </svg>
                  LINE
                </button>
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      alert('URLをコピーしました');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  URL
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Back to list */}
        <div className="mt-8 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center text-[#FF8C00] hover:underline font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            他のコラムを見る
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ArticleDetailContent params={params} />;
}
