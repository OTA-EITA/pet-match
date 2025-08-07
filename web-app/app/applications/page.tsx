'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Mock data for demonstration
const mockApplications = [
  {
    id: 'app-001',
    pet: {
      id: 'buddy-001',
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age_info: { age_text: '3歳6ヶ月' },
      location: 'Tokyo'
    },
    status: 'pending',
    appliedAt: '2025-01-15T14:00:00Z',
    message: '家族でBuddyを迎えたいと思っています。小さな子供がいますが、大丈夫でしょうか？',
    shelter: {
      name: '東京動物愛護センター',
      contact: 'tokyo-shelter@example.com'
    }
  },
  {
    id: 'app-002',
    pet: {
      id: 'luna-002',
      name: 'Luna',
      species: 'Cat',
      breed: 'Persian',
      age_info: { age_text: '2歳' },
      location: 'Osaka'
    },
    status: 'interview',
    appliedAt: '2025-01-12T10:00:00Z',
    message: 'Lunaちゃんの里親になりたいです。猫の飼育経験は豊富です。',
    shelter: {
      name: '大阪ねこの会',
      contact: 'osaka-cats@example.com'
    },
    nextStep: 'オンライン面接: 2025-01-18 14:00'
  }
]

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState(mockApplications)
  const [loading, setLoading] = useState(false)

  // Redirect non-adopter users
  if (user && user.type !== 'adopter') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">応募状況は里親希望者のみ確認可能です</p>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">審査中</span>
      case 'interview':
        return <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">面接予定</span>
      case 'approved':
        return <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">承認済み</span>
      case 'rejected':
        return <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">不承認</span>
      default:
        return <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">不明</span>
    }
  }

  const withdrawApplication = (appId: string) => {
    if (confirm('応募を取り下げますか？この操作は取り消せません。')) {
      setApplications(prev => prev.filter(app => app.id !== appId))
      alert('応募を取り下げました')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h1 className="text-3xl font-bold text-gray-900">応募状況</h1>
            </div>
            <p className="text-gray-600">あなたが応募したペットの状況を確認</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総応募数</p>
                  <p className="text-2xl font-semibold text-gray-900">{applications.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">審査中</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {applications.filter(app => app.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">面接予定</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {applications.filter(app => app.status === 'interview').length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">成約済み</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {applications.filter(app => app.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ応募していません</h3>
              <p className="text-gray-600 mb-6">気になるペットに応募してみましょう</p>
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
            <div className="space-y-6">
              {applications.map((application) => (
                <div key={application.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.pet.name}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
                        <span>🐕 {application.pet.species}</span>
                        <span>🏷️ {application.pet.breed}</span>
                        <span>📅 {application.pet.age_info.age_text}</span>
                        <span>📍 {application.pet.location}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        応募日: {new Date(application.appliedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/pets/${application.pet.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        詳細を見る
                      </Link>
                      <button
                        onClick={() => withdrawApplication(application.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        応募取り下げ
                      </button>
                    </div>
                  </div>

                  {/* Application Message */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">応募メッセージ:</h4>
                    <p className="text-sm text-gray-600">{application.message}</p>
                  </div>

                  {/* Shelter Info */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-700">保護団体: {application.shelter.name}</p>
                        <p className="text-sm text-gray-600">連絡先: {application.shelter.contact}</p>
                      </div>
                      
                      {/* Next Step */}
                      {application.nextStep && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">次のステップ:</p>
                          <p className="text-sm text-gray-700">{application.nextStep}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons for specific status */}
                  {application.status === 'interview' && (
                    <div className="mt-4 flex space-x-3">
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors">
                        面接参加確認
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors">
                        メッセージ送信
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
