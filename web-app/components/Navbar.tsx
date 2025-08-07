'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/pets" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐾</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PetMatch</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {/* Common Navigation */}
                <Link 
                  href="/pets"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ペット一覧
                </Link>

                {/* Shelter-specific Navigation */}
                {user?.type === 'shelter' && (
                  <>
                    <Link 
                      href="/my-pets"
                      className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      投稿管理
                    </Link>
                    <Link 
                      href="/pets/new"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      + ペット登録
                    </Link>
                  </>
                )}

                {/* Adopter-specific Navigation */}
                {user?.type === 'adopter' && (
                  <>
                    <Link 
                      href="/favorites"
                      className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      お気に入り
                    </Link>
                    <Link 
                      href="/applications"
                      className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      応募状況
                    </Link>
                  </>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      {user?.name}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user?.type === 'shelter' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.type === 'shelter' ? '保護団体' : '里親希望'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/login"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ログイン
                </Link>
                <Link 
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link 
                  href="/pets"
                  className="block text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  ペット一覧
                </Link>

                {user?.type === 'shelter' && (
                  <>
                    <Link 
                      href="/my-pets"
                      className="block text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      投稿管理
                    </Link>
                    <Link 
                      href="/pets/new"
                      className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      + ペット登録
                    </Link>
                  </>
                )}

                {user?.type === 'adopter' && (
                  <>
                    <Link 
                      href="/favorites"
                      className="block text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      お気に入り
                    </Link>
                    <Link 
                      href="/applications"
                      className="block text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      応募状況
                    </Link>
                  </>
                )}

                <div className="border-t pt-2 mt-2">
                  <div className="px-3 py-2 text-sm text-gray-700">
                    {user?.name} ({user?.type === 'shelter' ? '保護団体' : '里親希望'})
                  </div>
                  <button
                    onClick={logout}
                    className="block w-full text-left text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link 
                  href="/auth/login"
                  className="block text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  ログイン
                </Link>
                <Link 
                  href="/auth/register"
                  className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
