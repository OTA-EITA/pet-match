'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { petsApi } from '@/lib/api';
import { Pet } from '@/types/Pet';
import ImageUpload, { UploadedImage } from '@/components/ImageUpload';
import ImageGallery from '@/components/ImageGallery';

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // For demo purposes, allow editing

  const fetchPetDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching pet detail for ID: ${petId}`);
      const petData = await petsApi.getPet(petId);
      console.log('Pet detail received:', petData);
      
      setPet(petData);
    } catch (error) {
      console.error('Failed to fetch pet detail:', error);
      setError('ペット情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  const fetchPetImages = useCallback(async () => {
    try {
      setLoadingImages(true);
      console.log(`Fetching images for pet ID: ${petId}`);
      
      const response = await petsApi.images.getPetImages(petId);
      console.log('Pet images response:', response);
      
      setUploadedImages(response.images || []);
    } catch (error) {
      console.error('Failed to fetch pet images:', error);
      // Set empty array instead of erroring out
      setUploadedImages([]);
    } finally {
      setLoadingImages(false);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) {
      fetchPetDetail();
      fetchPetImages();
    }
  }, [petId, fetchPetDetail, fetchPetImages]);

  const handleContactPress = () => {
    alert('お問い合わせ機能は認証システムの実装後に利用可能になります。');
  };

  const handleFavoritePress = () => {
    alert('お気に入り機能は認証システムの実装後に利用可能になります。');
  };

  const handleImageUploaded = (newImage: UploadedImage) => {
    setUploadedImages(prev => [newImage, ...prev]);
    setUploadError(null);
  };

  const handleImageDeleted = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">ペット情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😿</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">ペット情報が見つかりませんでした</h2>
          <div className="space-x-4">
            <button 
              onClick={fetchPetDetail}
              className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              再試行
            </button>
            <button 
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button and edit toggle */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ペット一覧に戻る
          </button>
          
          {/* Edit mode toggle for demo */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              editMode 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {editMode ? '編集終了' : '画像編集'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{pet.name}</h1>
                  <p className="text-xl text-gray-600">{pet.age_info.age_text}</p>
                </div>
                <button 
                  onClick={handleFavoritePress}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  🤍
                </button>
              </div>
            </div>

            {/* Image Upload Section (in edit mode) */}
            {editMode && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">画像アップロード</h2>
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {uploadError}
                  </div>
                )}
                <ImageUpload
                  petId={petId}
                  onImageUploaded={handleImageUploaded}
                  onError={handleUploadError}
                />
              </div>
            )}

            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">画像ギャラリー</h2>
              {loadingImages ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">画像を読み込み中...</p>
                </div>
              ) : (
                <ImageGallery
                  petId={petId}
                  images={uploadedImages}
                  onImageDeleted={handleImageDeleted}
                  onError={handleUploadError}
                  editable={editMode}
                />
              )}
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-lg mr-3">🐕</span>
                  <span className="text-gray-600 w-20">種別:</span>
                  <span className="font-medium">{pet.species}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-3">🏷️</span>
                  <span className="text-gray-600 w-20">品種:</span>
                  <span className="font-medium">{pet.breed}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-3">⚧️</span>
                  <span className="text-gray-600 w-20">性別:</span>
                  <span className="font-medium">{pet.gender === 'male' ? 'オス' : 'メス'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-3">📏</span>
                  <span className="text-gray-600 w-20">サイズ:</span>
                  <span className="font-medium">{pet.size}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-3">🎨</span>
                  <span className="text-gray-600 w-20">色:</span>
                  <span className="font-medium">{pet.color}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-3">📍</span>
                  <span className="text-gray-600 w-20">所在地:</span>
                  <span className="font-medium">{pet.location}</span>
                </div>
              </div>
            </div>

            {/* Personality */}
            {pet.personality && pet.personality.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">性格</h2>
                <div className="flex flex-wrap gap-2">
                  {pet.personality.map((trait, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-secondary text-primary rounded-full border border-primary"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {pet.description && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">詳細説明</h2>
                <p className="text-gray-700 leading-relaxed">{pet.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Medical Information */}
            {pet.medical_info && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">医療情報</h2>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">ワクチン接種</p>
                    <p className={`font-bold ${pet.medical_info.vaccinated ? 'text-green-600' : 'text-orange-600'}`}>
                      {pet.medical_info.vaccinated ? '済み' : '未接種'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">避妊・去勢</p>
                    <p className={`font-bold ${(pet.medical_info.spayed_neutered || pet.medical_info.neutered) ? 'text-green-600' : 'text-orange-600'}`}>
                      {(pet.medical_info.spayed_neutered || pet.medical_info.neutered) ? '済み' : '未実施'}
                    </p>
                  </div>
                  {((pet.medical_info.health_conditions && pet.medical_info.health_conditions.length > 0) || 
                    (pet.medical_info.health_issues && pet.medical_info.health_issues.length > 0)) && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">健康状態</p>
                      {(pet.medical_info.health_conditions || pet.medical_info.health_issues || []).map((condition, index) => (
                        <p key={index} className="text-sm text-gray-700">• {condition}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Button */}
            <button 
              onClick={handleContactPress}
              className="w-full bg-primary hover:bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-bold transition-colors shadow-lg"
            >
              📞 お問い合わせ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
