'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authApi } from '@/lib/api';

type UserType = 'adopter' | 'shelter' | 'individual';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'adopter' as UserType,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('すべての項目を入力してください');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsLoading(true);
    const result = await authApi.signup({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      type: formData.type,
    });
    setIsLoading(false);

    if (result.data) {
      localStorage.setItem('token', result.data.token);
      router.push('/pets');
    } else {
      setError(result.error || '登録に失敗しました');
    }
  };

  const userTypes = [
    { value: 'adopter', label: '里親希望者', description: '猫を迎えたい方' },
    { value: 'shelter', label: '保護団体', description: '保護猫を譲渡したい団体' },
    { value: 'individual', label: '個人', description: '個人で猫を譲渡したい方' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/cat-logo.png"
            alt="OnlyCats"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-[#FF8C00]">新規登録</h1>
          <p className="text-gray-600 mt-2">アカウントを作成して始めましょう</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                お名前
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="山田太郎"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="6文字以上"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                パスワード（確認）
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="もう一度入力してください"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ユーザータイプ
              </label>
              <div className="space-y-2">
                {userTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.type === type.value
                        ? 'border-[#FF8C00] bg-[#FFF5E6]'
                        : 'border-gray-200 hover:border-[#FFD9B3]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleChange}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      formData.type === type.value ? 'border-[#FF8C00]' : 'border-gray-300'
                    }`}>
                      {formData.type === type.value && (
                        <div className="w-2 h-2 rounded-full bg-[#FF8C00]" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF8C00] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E67E00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登録中...
                </span>
              ) : (
                '登録する'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center mt-6">
            <span className="text-gray-500">すでにアカウントをお持ちの方は</span>
            <Link href="/login" className="text-[#FF8C00] font-medium ml-1 hover:underline">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
