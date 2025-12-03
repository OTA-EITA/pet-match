'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { petsApi, Pet, CreatePetData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function PetEditContent() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<CreatePetData>({
    name: '',
    species: 'cat',
    breed: '',
    gender: 'male',
    age_years: 0,
    age_months: 0,
    size: 'medium',
    description: '',
    personality: [],
    vaccinated: false,
    neutered: false,
    location: '',
  });
  const [personalityInput, setPersonalityInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && petId) {
      fetchPet();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, petId]);

  const fetchPet = async () => {
    setIsLoading(true);
    const result = await petsApi.getById(petId);
    if (result.data) {
      const petData = result.data;
      setPet(petData);
      setFormData({
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        gender: petData.gender,
        age_years: petData.age_info?.years || 0,
        age_months: petData.age_info?.months || petData.age_months || 0,
        size: petData.size,
        description: petData.description || '',
        personality: petData.personality || [],
        vaccinated: petData.medical_info?.vaccinated || false,
        neutered: petData.medical_info?.neutered || false,
        location: petData.location || '',
      });
    } else {
      setError('ペット情報の取得に失敗しました');
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addPersonality = () => {
    if (personalityInput.trim() && !formData.personality?.includes(personalityInput.trim())) {
      setFormData({
        ...formData,
        personality: [...(formData.personality || []), personalityInput.trim()],
      });
      setPersonalityInput('');
    }
  };

  const removePersonality = (trait: string) => {
    setFormData({
      ...formData,
      personality: formData.personality?.filter(p => p !== trait) || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('名前を入力してください');
      return;
    }
    if (!formData.breed.trim()) {
      setError('品種を入力してください');
      return;
    }

    setIsSaving(true);
    const result = await petsApi.update(petId, formData);
    setIsSaving(false);

    if (result.data) {
      router.push('/my-pets');
    } else {
      setError(result.error || '更新に失敗しました');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  if (user?.type === 'adopter') {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">このページは保護団体・個人の方専用です</h1>
          <Link
            href="/pets"
            className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
          >
            猫を探す
          </Link>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-[#FFF9F0]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ペットが見つかりません</h1>
          <Link
            href="/my-pets"
            className="inline-block px-8 py-3 bg-[#FF8C00] text-white rounded-xl font-bold hover:bg-[#E67E00] transition-colors"
          >
            マイペット一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      {/* Hero Section */}
      <div className="bg-[#FF8C00] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/my-pets" className="text-white/80 hover:text-white mb-2 inline-block">
            ← マイペット一覧に戻る
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">ペット情報を編集</h1>
          <p className="text-white/90 mt-2">{pet.name}の情報を更新</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <h2 className="text-lg font-bold text-gray-800 mb-4">基本情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ミケ"
                  className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  品種 *
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="ミックス"
                  className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性別
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={isSaving}
                >
                  <option value="male">オス</option>
                  <option value="female">メス</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サイズ
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={isSaving}
                >
                  <option value="small">小型</option>
                  <option value="medium">中型</option>
                  <option value="large">大型</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢（年）
                </label>
                <input
                  type="number"
                  name="age_years"
                  value={formData.age_years}
                  onChange={handleChange}
                  min="0"
                  max="30"
                  className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢（月）
                </label>
                <input
                  type="number"
                  name="age_months"
                  value={formData.age_months || 0}
                  onChange={handleChange}
                  min="0"
                  max="11"
                  className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                紹介文
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="性格や特徴、里親さんへのメッセージなど"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                disabled={isSaving}
              />
            </div>

            {/* Personality */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性格タグ
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={personalityInput}
                  onChange={(e) => setPersonalityInput(e.target.value)}
                  placeholder="人懐っこい"
                  className="flex-1 px-4 py-2 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPersonality();
                    }
                  }}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={addPersonality}
                  className="px-4 py-2 bg-[#FF8C00] text-white rounded-xl hover:bg-[#E67E00] transition-colors"
                  disabled={isSaving}
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.personality?.map((trait) => (
                  <span
                    key={trait}
                    className="inline-flex items-center px-3 py-1 bg-[#FFF5E6] text-[#FF8C00] rounded-full text-sm"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removePersonality(trait)}
                      className="ml-2 text-[#FF8C00] hover:text-[#E67E00]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medical Info */}
            <h2 className="text-lg font-bold text-gray-800 mb-4">医療情報</h2>

            <div className="flex gap-6 mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="vaccinated"
                  checked={formData.vaccinated}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#FF8C00] border-[#FFD9B3] rounded focus:ring-[#FF8C00]"
                  disabled={isSaving}
                />
                <span className="ml-2 text-gray-700">ワクチン接種済み</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="neutered"
                  checked={formData.neutered}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#FF8C00] border-[#FFD9B3] rounded focus:ring-[#FF8C00]"
                  disabled={isSaving}
                />
                <span className="ml-2 text-gray-700">去勢/避妊済み</span>
              </label>
            </div>

            {/* Location */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="東京都"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                disabled={isSaving}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Link
                href="/my-pets"
                className="flex-1 text-center py-3 border-2 border-[#FF8C00] text-[#FF8C00] rounded-xl font-bold hover:bg-[#FFF5E6] transition-colors"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[#FF8C00] text-white py-3 rounded-xl font-bold hover:bg-[#E67E00] disabled:opacity-50 transition-colors"
              >
                {isSaving ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function PetEditPage() {
  return <PetEditContent />;
}
