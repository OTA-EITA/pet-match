'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { authApi } from '@/lib/api';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function ProfileEditContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: '',
        address: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setIsLoading(true);
    const result = await authApi.updateProfile({
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
    });
    setIsLoading(false);

    if (result.data) {
      updateUser(result.data);
      setSuccess('プロフィールを更新しました');
    } else {
      setError(result.error || '更新に失敗しました');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.current_password || !passwordData.new_password) {
      setPasswordError('現在のパスワードと新しいパスワードを入力してください');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('新しいパスワードは6文字以上で入力してください');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }

    setIsLoading(true);
    const result = await authApi.updatePassword({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
    setIsLoading(false);

    if (!result.error) {
      setPasswordSuccess('パスワードを変更しました');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } else {
      setPasswordError(result.error || 'パスワードの変更に失敗しました');
    }
  };

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <Header />

      {/* Hero Section */}
      <div className="bg-[#FF8C00] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/profile" className="text-white/80 hover:text-white mb-2 inline-block">
            ← プロフィールに戻る
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">プロフィール編集</h1>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">基本情報</h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                disabled
              />
              <p className="text-sm text-gray-400 mt-1">メールアドレスは変更できません</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="090-1234-5678"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="東京都渋谷区..."
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF8C00] text-white py-3 rounded-xl font-bold hover:bg-[#E67E00] disabled:opacity-50 transition-colors"
            >
              {isLoading ? '更新中...' : '更新する'}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">パスワード変更</h2>

          <form onSubmit={handlePasswordSubmit}>
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
                {passwordSuccess}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在のパスワード
              </label>
              <input
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder="6文字以上"
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-[#FFD9B3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '変更中...' : 'パスワードを変更'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <AuthProvider>
      <ProfileEditContent />
    </AuthProvider>
  );
}
