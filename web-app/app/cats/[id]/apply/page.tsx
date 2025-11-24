'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { applicationApi, CreateApplicationRequest } from '@/lib/applicationApi';

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [formData, setFormData] = useState<CreateApplicationRequest>({
    pet_id: petId,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.message.trim()) {
      setError('応募理由を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      await applicationApi.createApplication(formData);
      router.push('/applications');
    } catch (err: any) {
      console.error('Failed to create application:', err);
      setError(err.response?.data?.error || '応募の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">応募申請</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            応募理由 *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="この猫を家族に迎えたい理由や、飼育環境について教えてください..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-2">
            飼育環境、家族構成、過去のペット飼育経験などを記載してください
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : '応募する'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
