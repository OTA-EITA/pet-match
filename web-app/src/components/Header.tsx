'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-[#FF8C00] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/pets" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image src="/cat-logo.png" alt="OnlyCats" width={32} height={32} />
            <span className="text-xl font-bold">OnlyCats</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pets" className="hover:opacity-80 transition-opacity">
              猫を探す
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="hover:opacity-80 transition-opacity">
                  マイページ
                </Link>
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
          <button className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
