'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { devTokenUtils } from '@/lib/auth';

export default function DevAuthPanel() {
  const { user, login, register, logout, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'adopter' | 'shelter'>('adopter');
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Only render on client-side to avoid hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await register(email, password, name, userType);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuickLogin = async (testEmail: string, testPassword: string) => {
    setError('');
    try {
      await login(testEmail, testPassword);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDevToken = () => {
    devTokenUtils.setDevToken();
    window.location.reload();
  };

  const clearDevToken = () => {
    devTokenUtils.clearDevToken();
    window.location.reload();
  };

  // Only show in development and after client-side hydration
  if (!isClient || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-yellow-800">🔧 Dev Auth Panel</h3>
        <button
          onClick={() => document.querySelector('.dev-auth-panel')?.classList.toggle('hidden')}
          className="text-yellow-600 hover:text-yellow-800"
        >
          _
        </button>
      </div>
      
      <div className="dev-auth-panel space-y-3">
        {user ? (
          <div className="bg-green-50 p-3 rounded">
            <p className="font-medium text-green-800">✅ Authenticated</p>
            <p className="text-sm text-green-600">
              {user.email} ({user.type})
            </p>
            <p className="text-xs text-gray-500">
              ID: {user.id}
            </p>
            <button
              onClick={logout}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Test Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-800">Quick Login:</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickLogin('test@example.com', 'password123')}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  Adopter
                </button>
                <button
                  onClick={() => handleQuickLogin('shelter@example.com', 'password123')}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  disabled={loading}
                >
                  Shelter
                </button>
              </div>
            </div>

            {/* DEV_TOKEN */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-800">Dev Token:</p>
              <div className="flex space-x-2">
                <button
                  onClick={handleDevToken}
                  className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                >
                  Set DEV_TOKEN
                </button>
                {devTokenUtils.isUsingDevToken() && (
                  <button
                    onClick={clearDevToken}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              {devTokenUtils.isUsingDevToken() && (
                <p className="text-xs text-purple-600">Using DEV_TOKEN</p>
              )}
            </div>

            {/* Manual Forms */}
            <details className="text-sm">
              <summary className="text-yellow-800 font-medium cursor-pointer">Manual Auth</summary>
              <div className="mt-2 space-y-2">
                <form onSubmit={handleLogin} className="space-y-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Login'}
                  </button>
                </form>

                <form onSubmit={handleRegister} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as 'adopter' | 'shelter')}
                    className="w-full px-2 py-1 text-xs border rounded"
                  >
                    <option value="adopter">Adopter</option>
                    <option value="shelter">Shelter</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Register'}
                  </button>
                </form>
              </div>
            </details>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-2 rounded text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
