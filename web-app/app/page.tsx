'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-400 via-primary-500 to-accent-400 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🐱</div>
          <div className="absolute bottom-20 right-10 text-9xl">🐾</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-5">😺</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              猫との<br className="sm:hidden" />運命の出会い
            </h1>
            <p className="text-base sm:text-lg lg:text-2xl mb-8 sm:mb-10 text-primary-50 leading-relaxed px-4">
              保護猫・ブリーダー猫との新しい暮らしを<br className="hidden sm:block" />
              OnlyCatsがサポートします
            </p>

            {/* メインCTA */}
            <div className="mb-8">
              <Link
                href="/cats"
                className="inline-block bg-white text-primary-600 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold hover:bg-neutral-50 transition-all shadow-lg hover:shadow-xl touchable"
              >
                🔍 猫を探す
              </Link>
            </div>

            {/* 信頼性訴求 */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-primary-100">
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>審査済みユーザーのみ</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>安心・安全な取引</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>完全無料</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 登録案内 */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3">
              会員登録（無料）
            </h2>
            <p className="text-base sm:text-lg text-neutral-600">
              OnlyCatsは審査制のプラットフォームです<br />
              安心・安全な猫の譲渡をサポートします
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* 個人の方 */}
            <div className="card p-8 sm:p-10 text-center hover:shadow-card-hover transition-all">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl sm:text-6xl">🏠</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
                個人の方
              </h3>
              <p className="text-neutral-600 mb-4 leading-relaxed">
                里親として猫を迎えたい方
              </p>
              <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-neutral-700 font-semibold mb-2">📋 審査に必要なもの</p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 身分証明書（運転免許証等）</li>
                </ul>
              </div>
              <Link
                href="/auth/register?type=adopter"
                className="block w-full bg-accent-500 hover:bg-accent-600 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg touchable"
              >
                個人として登録
              </Link>
            </div>

            {/* シェルター・ブリーダーの方 */}
            <div className="card p-8 sm:p-10 text-center hover:shadow-card-hover transition-all">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl sm:text-6xl">🏢</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
                シェルター・ブリーダーの方
              </h3>
              <p className="text-neutral-600 mb-4 leading-relaxed">
                保護猫団体・ブリーダーとして<br />
                猫を掲載したい方
              </p>
              <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-neutral-700 font-semibold mb-2">📋 審査に必要なもの</p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 身分証明書（運転免許証等）</li>
                  <li>• 団体証明書 or 事業者登録証</li>
                  <li>• 動物取扱業登録証（該当者のみ）</li>
                </ul>
              </div>
              <Link
                href="/auth/register?type=shelter"
                className="block w-full bg-secondary-500 hover:bg-secondary-600 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg touchable"
              >
                シェルター・ブリーダーとして登録
              </Link>
            </div>
          </div>

          {/* 審査フロー */}
          <div className="mt-12 bg-primary-50 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4 text-center">
              📝 登録から利用開始までの流れ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
                <p className="text-sm font-medium text-neutral-900 mb-1">会員登録</p>
                <p className="text-xs text-neutral-600">メールアドレスで登録</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
                <p className="text-sm font-medium text-neutral-900 mb-1">書類提出</p>
                <p className="text-xs text-neutral-600">身分証明書等をアップロード</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
                <p className="text-sm font-medium text-neutral-900 mb-1">審査完了</p>
                <p className="text-xs text-neutral-600">全機能が利用可能に</p>
              </div>
            </div>
            <p className="text-center text-sm text-neutral-600 mt-6">
              ※審査は通常1〜3営業日で完了します
            </p>
          </div>

          {/* 既にアカウントをお持ちの方 */}
          <div className="text-center mt-8">
            <p className="text-neutral-600">
              既にアカウントをお持ちの方は{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-semibold touchable">
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-12 sm:py-16 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4">
              OnlyCats の特徴
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-neutral-600">
              安心・安全な猫の譲渡をサポート
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="card p-6 text-center hover:shadow-card-hover transition-all touchable">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">🛡️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-900">審査制</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                全ユーザーの身分確認<br />
                安心して利用できます
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-card-hover transition-all touchable">
              <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">🔍</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-900">簡単検索</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                地域・性格・種類から<br />
                ぴったりの猫を探せます
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-card-hover transition-all touchable">
              <div className="bg-gradient-to-br from-accent-100 to-accent-200 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">💬</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-900">コミュニティ</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                猫好き同士で<br />
                情報交換も
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-card-hover transition-all touchable sm:col-span-2 lg:col-span-1">
              <div className="bg-gradient-to-br from-primary-200 to-accent-200 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">📚</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-900">猫図鑑</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                飼育方法の情報も充実<br />
                初めてでも安心
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-card-hover transition-all touchable">
              <div className="bg-gradient-to-br from-secondary-200 to-primary-200 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">❤️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-900">トライアル</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                面会・トライアル期間で<br />
                相性を確認
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-card-hover transition-all touchable">
              <div className="bg-gradient-to-br from-accent-200 to-secondary-200 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">📱</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-900">スマホ最適</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                いつでもどこでも<br />
                快適に利用できます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl sm:text-8xl mb-6">😺</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4">
            あなたを待つ猫がいます
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-neutral-700 mb-6 sm:mb-8 leading-relaxed">
            OnlyCatsで素敵な出会いを見つけましょう
          </p>
          <Link
            href="/cats"
            className="inline-block bg-primary-500 text-white px-8 sm:px-10 py-4 rounded-2xl text-lg font-bold hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl touchable"
          >
            今すぐ猫を探す
          </Link>
        </div>
      </section>
    </div>
  );
}
