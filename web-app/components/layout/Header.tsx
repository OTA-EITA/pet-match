'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-neutral-200 safe-area-padding">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 touchable no-tap-highlight">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-2xl sm:text-3xl">🐱</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              OnlyCats
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link 
              href="/cats"
              className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              猫を探す
            </Link>
            <Link 
              href="/portal"
              className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              猫図鑑
            </Link>
            <Link 
              href="/community"
              className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              コミュニティ
            </Link>

            {isAuthenticated ? (
              <>
                {/* ダッシュボードリンク */}
                <Link 
                  href="/dashboard"
                  className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>ダッシュボード</span>
                </Link>

                {user?.type === 'shelter' && (
                  <Link 
                    href="/cats/new"
                    className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>猫を登録</span>
                  </Link>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition">
                    <div className="h-9 w-9 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Link>
                  
                  <button
                    onClick={logout}
                    className="text-neutral-500 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-neutral-700 hover:text-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  無料登録
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden touchable no-tap-highlight p-2 text-neutral-700 hover:text-neutral-900"
            aria-label="メニュー"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu（スライドイン） */}
        {mobileMenuOpen && (
          <>
            {/* オーバーレイ */}
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* メニュー本体 */}
            <div className="fixed top-16 left-0 right-0 bg-white border-b border-neutral-200 shadow-lg lg:hidden animate-fade-in safe-area-padding">
              <nav className="py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <Link 
                  href="/cats"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                >
                  🔍 猫を探す
                </Link>
                <Link 
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                >
                  📚 猫図鑑
                </Link>
                <Link 
                  href="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                >
                  💬 コミュニティ
                </Link>

                {isAuthenticated ? (
                  <>
                    <div className="border-t border-neutral-200 my-3" />
                    
                    {/* ダッシュボード（スマホ） */}
                    <Link 
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                    >
                      📊 ダッシュボード
                    </Link>

                    {user?.type === 'shelter' && (
                      <Link 
                        href="/cats/new"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-3 rounded-lg text-base font-medium transition touchable"
                      >
                        ➕ 猫を登録
                      </Link>
                    )}

                    {user?.type === 'adopter' && (
                      <>
                        <Link
                          href="/favorites"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                        >
                          ❤️ お気に入り
                        </Link>
                        <Link
                          href="/inquiries"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                        >
                          💌 問い合わせ
                        </Link>
                        <Link
                          href="/applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                        >
                          📋 応募状況
                        </Link>
                      </>
                    )}

                    <div className="border-t border-neutral-200 my-3" />
                    
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg hover:bg-neutral-50 transition touchable"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{user?.name}</div>
                          <div className="text-xs text-neutral-500">
                            {user?.type === 'shelter' ? '保護団体' : '里親希望'}
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                    >
                      🚪 ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-neutral-200 my-3" />
                    <Link 
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-neutral-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg text-base font-medium transition touchable"
                    >
                      ログイン
                    </Link>
                    <Link 
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg text-base font-medium text-center transition touchable"
                    >
                      無料登録
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
