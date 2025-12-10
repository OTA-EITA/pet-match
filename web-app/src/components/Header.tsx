'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/lib/api';

export default function Header() {
  const { user, isAuthenticated, isLoading, isInitialized, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 認証の初期化が完了し、ログインしている場合のみAPIを呼ぶ
    if (!isInitialized || isLoading || !isAuthenticated) {
      return;
    }

    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, isInitialized]);

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      if (result.data) {
        setUnreadCount(result.data.unread_count || 0);
      }
    } catch {
      // エラー時は何もしない（ログアウト中など）
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-[#FF8C00] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/pets" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image src="/cat-logo.png" alt="OnlyCats" width={32} height={32} />
            <span className="text-xl font-bold">OnlyCats</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pets" className="hover:opacity-80 transition-opacity">
              猫を探す
            </Link>
            <Link href="/shelters" className="hover:opacity-80 transition-opacity">
              シェルター
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/favorites" className="hover:opacity-80 transition-opacity">
                  お気に入り
                </Link>
                <Link href="/messages" className="hover:opacity-80 transition-opacity">
                  メッセージ
                </Link>
                <Link href="/notifications" className="relative hover:opacity-80 transition-opacity" title="通知">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="hover:opacity-80 transition-opacity">
                  マイページ
                </Link>
                <span className="text-white/90 text-sm">
                  {user?.name || user?.email?.split('@')[0]} 様
                </span>
                <button
                  onClick={logout}
                  className="bg-white text-[#FF8C00] px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:opacity-80 transition-opacity"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-[#FF8C00] px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニュー"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#FF8C00] border-t border-white/20">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/pets"
              className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
              onClick={closeMenu}
            >
              猫を探す
            </Link>
            <Link
              href="/shelters"
              className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
              onClick={closeMenu}
            >
              シェルター
            </Link>
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-white/90 text-sm border-b border-white/20 mb-2">
                  {user?.name || user?.email?.split('@')[0]} 様
                </div>
                <Link
                  href="/favorites"
                  className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                  onClick={closeMenu}
                >
                  お気に入り
                </Link>
                <Link
                  href="/messages"
                  className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                  onClick={closeMenu}
                >
                  メッセージ
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center justify-between py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                  onClick={closeMenu}
                >
                  <span>通知</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/inquiries"
                  className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                  onClick={closeMenu}
                >
                  問い合わせ履歴
                </Link>
                {user?.type === 'shelter' && (
                  <>
                    <Link
                      href="/my-pets"
                      className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                      onClick={closeMenu}
                    >
                      登録したペット
                    </Link>
                    <Link
                      href="/inquiries/received"
                      className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                      onClick={closeMenu}
                    >
                      受信した問い合わせ
                    </Link>
                  </>
                )}
                <Link
                  href="/profile"
                  className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                  onClick={closeMenu}
                >
                  マイページ
                </Link>
                <div className="pt-2 border-t border-white/20">
                  <button
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="w-full text-left py-2 hover:bg-white/10 rounded-lg px-3 transition-colors text-white/90"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2 hover:bg-white/10 rounded-lg px-3 transition-colors"
                  onClick={closeMenu}
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="block py-2 bg-white text-[#FF8C00] rounded-lg px-3 font-medium text-center"
                  onClick={closeMenu}
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
