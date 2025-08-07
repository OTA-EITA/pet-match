'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Mock data for demonstration
const mockFavorites = [
  {
    id: 'buddy-001',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    age_info: { age_text: '3歳6ヶ月' },
    gender: 'male',
    location: 'Tokyo',
    images: [],
    personality: ['friendly', 'energetic'],
    added_to_favorites: '2025-01-16T10:00:00Z'
  },
  {
    id: 'hachi-003',
    name: 'Hachi',
    species: 'Dog', 
    breed: 'Shiba Inu',
    age_info: { age_text: '1歳8ヶ月' },
    gender: 'male',
    location: 'Kyoto',
    images: [],
    personality: ['independent', 'alert'],
    added_to_favorites: '2025-01-16T11:00:00Z'
  }
]

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState(mockFavorites)
  const [loading, setLoading] = useState(false)

  // Redirect non-adopter users
  if (user && user.type !== 'adopter') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">お気に入り機能は里親希望者のみ利用可能です</p>
          <Link 
            href="/pets"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
          >
            ペット一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const removeFavorite = (petId: string) => {
    if (confirm('お気に入りから削除しますか？')) {
      setFavorites(prev => prev.filter(pet => pet.id !== petId))
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h1 className="text-3xl font-bold text-gray-900">お気に入り</h1>
            </div>
            <p className="text-gray-600">気になるペットをまとめて管理</p>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">お気に入り登録数</p>
                <p className="text-3xl font-bold text-gray-900">{favorites.length} 匹</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">最新追加</p>
                <p className="text-sm text-gray-900">
                  {favorites.length > 0 
                    ? new Date(Math.max(...favorites.map(f => new Date(f.added_to_favorites).getTime()))).toLocaleDateString('ja-JP')
                    : 'なし'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Favorites Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-6xl mb-4">💔</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">お気に入りがまだありません</h3>
              <p className="text-gray-600 mb-6">気になるペットを見つけてお気に入りに追加しましょう</p>
              <Link
                href="/pets"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>ペットを探す</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((pet) => (
                <div key={pet.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Pet Image */}
                  <div className="relative h-48 bg-gray-200">
                    {pet.images && pet.images.length > 0 ? (
                      <Image
                        src={pet.images[0]}
                        alt={pet.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-4xl">
                          {pet.species === 'Dog' ? '🐕' : '🐱'}
                        </span>
                      </div>
                    )}
                    
                    {/* Remove from favorites button */}
                    <button
                      onClick={() => removeFavorite(pet.id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 17.5 3 20.58 3 23 5.42 23 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                    
                    {/* Added date badge */}
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {new Date(pet.added_to_favorites).toLocaleDateString('ja-JP')} 追加
                    </div>
                  </div>

                  {/* Pet Information */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{pet.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{pet.age_info.age_text}</p>
                    
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <span className="mr-3">🐕 {pet.species}</span>
                      <span className="mr-3">📍 {pet.location}</span>
                    </div>

                    {/* Personality tags */}
                    {pet.personality && pet.personality.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pet.personality.slice(0, 2).map((trait, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {trait}
                          </span>
                        ))}
                        {pet.personality.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{pet.personality.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      {pet.breed} • {pet.gender === 'male' ? '♂️ オス' : '♀️ メス'}
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/pets/${pet.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm text-center transition-colors"
                      >
                        詳細を見る
                      </Link>
                      <button
                        onClick={() => alert('応募機能は開発中です')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors"
                      >
                        応募する
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
