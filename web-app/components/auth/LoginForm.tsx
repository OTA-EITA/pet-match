'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthError } from '@/lib/auth';

const LoginForm = () => {
  const router = useRouter();
  const { login, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
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
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (error instanceof AuthError) {
        setAuthError(error.message);
      } else {
        setAuthError('ログインに失敗しました。もう一度お試しください。');
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
            OnlyCats にログイン
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/register" className="font-semibold text-primary-600 hover:text-primary-700 touchable">
              新規登録
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
            
            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={`block w-full px-4 py-3 border ${
                  errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* ログインボタン */}
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
                  ログイン中...
                </span>
              ) : (
                'ログイン'
              )}
            </button>

            {/* パスワード忘れ */}
            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-neutral-600 hover:text-primary-600 touchable"
              >
                パスワードをお忘れですか？
              </Link>
            </div>
          </form>
        </div>

        {/* 別の方法でログイン（将来的に） */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>猫との出会いはOnlyCatsから 🐾</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
