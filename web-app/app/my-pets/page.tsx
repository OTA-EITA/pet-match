'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Pet } from '@/types/Pet'
import { petsApi } from '@/lib/api'

export default function MyPetsPage() {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMyPets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to get pets filtered by owner first
      // If backend doesn't support owner filtering, it will get all pets
      const response = await petsApi.getMyPets()
      
      // Filter by current user if backend doesn't support owner filtering
      let myPets = response.pets
      if (user?.id) {
        myPets = response.pets.filter(pet => pet.owner_id === user.id)
      }
      
      setPets(myPets)
    } catch (err: any) {
      console.error('Failed to load pets:', err)
      setError('ペット一覧の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch user's pets on component mount
  useEffect(() => {
    if (user && user.type === 'shelter') {
      loadMyPets()
    }
  }, [user, loadMyPets])

  const handleDeletePet = async (petId: string, petName: string) => {
    if (!confirm(`${petName}を削除してもよろしいですか？この操作は取り消せません。`)) {
      return
    }

    try {
      await petsApi.deletePet(petId)
      setPets(prev => prev.filter(pet => pet.id !== petId))
      alert(`${petName}を削除しました。`)
    } catch (err: any) {
      console.error('Failed to delete pet:', err)
      alert('ペット削除に失敗しました。')
    }
  }

  // Redirect non-shelter users
  if (user && user.type !== 'shelter') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">投稿管理は保護団体のみ可能です</p>
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">投稿管理</h1>
              <p className="text-gray-600">あなたが登録したペットの管理</p>
            </div>
            <Link
              href="/pets/new"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>新しいペットを登録</span>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-700">{error}</div>
              </div>
              <button 
                onClick={loadMyPets}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
              >
                再試行
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0H3m2 0V9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総投稿数</p>
                  <p className="text-2xl font-semibold text-gray-900">{pets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">里親募集中</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pets.filter(p => p.status === 'available').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">応募者待ち</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pets.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">成約済み</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pets.filter(p => p.status === 'adopted').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pets List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : pets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">まだペットが登録されていません</h3>
              <p className="text-gray-600 mb-6">初めてのペットを登録して里親募集を開始しましょう</p>
              <Link
                href="/pets/new"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>ペットを登録</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">登録済みペット</h2>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ペット
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        種類・品種
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        年齢・性別
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録日
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pets.map((pet) => (
                      <tr key={pet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-2xl">
                                  {pet.species === 'Dog' ? '🐕' : pet.species === 'Cat' ? '🐱' : '🐾'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{pet.name}</div>
                              <div className="text-sm text-gray-500">ID: {pet.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{pet.species}</div>
                          <div className="text-gray-500">{pet.breed || '未設定'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{pet.age_info?.age_text || 'N/A'}</div>
                          <div className="text-gray-500">{pet.gender === 'male' ? 'オス' : 'メス'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pet.status === 'available' 
                              ? 'bg-green-100 text-green-800'
                              : pet.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : pet.status === 'adopted'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pet.status === 'available' ? '募集中' : pet.status === 'pending' ? '審査中' : pet.status === 'adopted' ? '成約済み' : pet.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(pet.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link
                            href={`/pets/${pet.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細
                          </Link>
                          <Link
                            href={`/pets/${pet.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            編集
                          </Link>
                          <button 
                            onClick={() => handleDeletePet(pet.id, pet.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
