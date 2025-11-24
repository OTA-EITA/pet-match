'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface PetFormData {
  name: string
  species: string
  breed: string
  ageYears: number
  ageMonths: number
  isEstimated: boolean
  gender: 'male' | 'female'
  size: 'small' | 'medium' | 'large' | 'extra_large'
  color: string
  personality: string[]
  description: string
  location: string
  medicalInfo: {
    vaccinated: boolean
    neutered: boolean
    healthIssues: string[]
  }
}

export default function NewPetPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: 'Dog',
    breed: '',
    ageYears: 0,
    ageMonths: 0,
    isEstimated: false,
    gender: 'male',
    size: 'medium',
    color: '',
    personality: [],
    description: '',
    location: '',
    medicalInfo: {
      vaccinated: false,
      neutered: false,
      healthIssues: []
    }
  })

  // Redirect non-shelter users
  if (user && user.type !== 'shelter') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">ペット登録は保護団体のみ可能です</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { petsApi } = await import('@/lib/api')
      
      // Create pet via API
      const newPet = await petsApi.createPet(formData)
      
      alert(`${newPet.name}の登録が完了しました！`)
      router.push('/my-pets')
      
    } catch (err: any) {
      console.error('Pet registration error:', err)
      const errorMessage = err.response?.data?.error || 'ペット登録に失敗しました。もう一度お試しください。'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const personalityOptions = [
    '人懐っこい', '元気', '穏やか', '甘えん坊', '独立心旺盛', 
    '遊び好き', '賢い', '忠実', '警戒心強い', '社交的'
  ]

  const togglePersonality = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }))
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいペットを登録</h1>
              <p className="text-gray-600">里親を待っているペットの情報を詳しく入力してください</p>
            </div>
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
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">基本情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ペットの名前 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: ポチ"
                  />
                </div>

                {/* Species */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    動物の種類 *
                  </label>
                  <select
                    required
                    value={formData.species}
                    onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Dog">犬</option>
                    <option value="Cat">猫</option>
                    <option value="Rabbit">うさぎ</option>
                    <option value="Bird">鳥</option>
                    <option value="Other">その他</option>
                  </select>
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    品種
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 柴犬、ミックス"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年齢 *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.ageYears}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageYears: parseInt(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="flex items-center text-gray-500">歳</span>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={formData.ageMonths}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageMonths: parseInt(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="flex items-center text-gray-500">ヶ月</span>
                  </div>
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formData.isEstimated}
                      onChange={(e) => setFormData(prev => ({ ...prev, isEstimated: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">推定年齢</span>
                  </label>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別 *
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">オス</option>
                    <option value="female">メス</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">身体的特徴</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サイズ *
                  </label>
                  <select
                    required
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">小型（〜10kg）</option>
                    <option value="medium">中型（10-25kg）</option>
                    <option value="large">大型（25-40kg）</option>
                    <option value="extra_large">超大型（40kg〜）</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    毛色・色
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 茶色、白、黒白"
                  />
                </div>
              </div>
            </div>

            {/* Personality */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">性格・特徴</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {personalityOptions.map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => togglePersonality(trait)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.personality.includes(trait)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">医療情報</h2>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.medicalInfo.vaccinated}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      medicalInfo: { ...prev.medicalInfo, vaccinated: e.target.checked }
                    }))}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">ワクチン接種済み</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.medicalInfo.neutered}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      medicalInfo: { ...prev.medicalInfo, neutered: e.target.checked }
                    }))}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">避妊・去勢手術済み</span>
                </label>
              </div>
            </div>

            {/* Description & Location */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">詳細情報</h2>
              
              <div className="space-y-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    所在地 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 東京都渋谷区"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    紹介文
                  </label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ペットの性格、好きなこと、里親になる方へのメッセージなどを自由にお書きください..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登録中...
                  </>
                ) : (
                  'ペットを登録'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
