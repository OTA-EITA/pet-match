'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthError } from '@/lib/auth';

const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loading } = useAuth();
  
  // URLパラメータから type を取得
  const typeFromUrl = searchParams.get('type') as 'adopter' | 'shelter' | null;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    type: (typeFromUrl || 'adopter') as 'adopter' | 'shelter',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');

  // URLパラメータが変わったら type を更新
  useEffect(() => {
    if (typeFromUrl) {
      setFormData(prev => ({ ...prev, type: typeFromUrl }));
    }
  }, [typeFromUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (authError) {
      setAuthError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }

    if (!formData.name) {
      newErrors.name = '名前を入力してください';
    } else if (formData.name.length < 2) {
      newErrors.name = '名前は2文字以上で入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name, formData.type);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      if (error instanceof AuthError) {
        setAuthError(error.message);
      } else {
        setAuthError('登録に失敗しました。もう一度お試しください。');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl shadow-lg mb-4">
            <span className="text-5xl">🐱</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            OnlyCats に登録
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="font-semibold text-primary-600 hover:text-primary-700 touchable">
              ログイン
            </Link>
          </p>
        </div>
        
        {/* フォーム */}
        <div className="card p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {authError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-700 leading-relaxed">{authError}</div>
                </div>
              </div>
            )}

            {/* ユーザー種別 */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-2">
                利用目的
              </label>
              <select
                id="type"
                name="type"
                className="block w-full px-4 py-3 border border-neutral-300 bg-white rounded-xl focus:ring-primary-500 focus:border-primary-500 transition"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="adopter">里親になりたい（猫を探す）</option>
                <option value="shelter">保護団体・ブリーダー（猫を掲載）</option>
              </select>
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`block w-full px-4 py-3 border ${
                  errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition`}
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                お名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className={`block w-full px-4 py-3 border ${
                  errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition`}
                placeholder="山田太郎"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className={`block w-full px-4 py-3 border ${
                  errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition`}
                placeholder="6文字以上"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`block w-full px-4 py-3 border ${
                  errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition`}
                placeholder="もう一度入力"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all touchable shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登録中...
                </span>
              ) : (
                '無料登録する'
              )}
            </button>

            {/* 利用規約 */}
            <p className="text-xs text-center text-neutral-500 leading-relaxed">
              登録することで、OnlyCatsの
              <Link href="/terms" className="text-primary-600 hover:underline">利用規約</Link>
              および
              <Link href="/privacy" className="text-primary-600 hover:underline">プライバシーポリシー</Link>
              に同意したものとみなされます
            </p>
          </form>
        </div>

        {/* フッター */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>猫との出会いはOnlyCatsから 🐾</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
