'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { adminApi, DashboardStats, User, Pet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function AdminDashboardContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pets'>('overview');

  useEffect(() => {
    if (isAuthenticated && user?.type === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    setIsLoading(true);
    const [statsResult, usersResult, petsResult] = await Promise.all([
      adminApi.getStats(),
      adminApi.getUsers({ limit: 10 }),
      adminApi.getPets({ limit: 10 }),
    ]);

    if (statsResult.data?.stats) {
      setStats(statsResult.data.stats);
    }
    if (usersResult.data?.users) {
      setUsers(usersResult.data.users);
    }
    if (petsResult.data?.pets) {
      setPets(petsResult.data.pets);
    }
    setIsLoading(false);
  };

  const handleVerifyUser = async (userId: string, verified: boolean) => {
    await adminApi.updateUserStatus(userId, verified);
    setUsers(users.map(u => u.id === userId ? { ...u, verified } : u));
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('このペットを削除してもよろしいですか？')) return;
    await adminApi.deletePet(petId);
    setPets(pets.filter(p => p.id !== petId));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-6">このページは管理者のみアクセス可能です</p>
          <Link
            href="/pets"
            className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] transition-colors"
          >
            トップページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">管理者ダッシュボード</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: 'overview', label: '概要' },
            { id: 'users', label: 'ユーザー管理' },
            { id: 'pets', label: 'ペット管理' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#FF8C00] border-b-2 border-[#FF8C00]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent mb-4" />
            <p className="text-gray-500">データを読み込み中...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard title="総ユーザー数" value={stats.total_users} icon="users" />
                  <StatCard title="総ペット数" value={stats.total_pets} icon="pets" />
                  <StatCard title="募集中のペット" value={stats.active_pets} icon="active" color="green" />
                  <StatCard title="譲渡済み" value={stats.adopted_pets} icon="adopted" color="blue" />
                  <StatCard title="総問い合わせ数" value={stats.total_inquiries} icon="inquiries" />
                  <StatCard title="対応中の問い合わせ" value={stats.pending_inquiries} icon="pending" color="orange" />
                  <StatCard title="今日の新規ユーザー" value={stats.new_users_today} icon="new" color="purple" />
                  <StatCard title="今日の新規ペット" value={stats.new_pets_today} icon="new" color="purple" />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">クイックアクション</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-2xl mb-2 block">👥</span>
                      <span className="font-medium text-gray-800">ユーザー管理</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('pets')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-2xl mb-2 block">🐱</span>
                      <span className="font-medium text-gray-800">ペット管理</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800">ユーザー一覧</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">名前</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">メール</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">タイプ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">認証状態</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">登録日</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{u.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              u.type === 'shelter' ? 'bg-blue-100 text-blue-700' :
                              u.type === 'admin' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {u.type === 'shelter' ? 'シェルター' : u.type === 'admin' ? '管理者' : '一般'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {u.verified ? (
                              <span className="text-green-600">✓ 認証済み</span>
                            ) : (
                              <span className="text-gray-400">未認証</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(u.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {u.type === 'shelter' && (
                              <button
                                onClick={() => handleVerifyUser(u.id, !u.verified)}
                                className={`px-3 py-1 rounded text-xs ${
                                  u.verified
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                              >
                                {u.verified ? '認証解除' : '認証する'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pets Tab */}
            {activeTab === 'pets' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800">ペット一覧</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">名前</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">種類</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ステータス</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">登録日</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pets.map((pet) => (
                        <tr key={pet.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">
                            <Link href={`/pets/${pet.id}`} className="text-[#FF8C00] hover:underline">
                              {pet.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{pet.breed}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              pet.status === 'available' ? 'bg-green-100 text-green-700' :
                              pet.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {pet.status === 'available' ? '募集中' :
                               pet.status === 'pending' ? '交渉中' : '譲渡済み'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(pet.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDeletePet(pet.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'default' }: {
  title: string;
  value: number;
  icon: string;
  color?: 'default' | 'green' | 'blue' | 'orange' | 'purple';
}) {
  const colorClasses = {
    default: 'bg-white',
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    orange: 'bg-orange-50',
    purple: 'bg-purple-50',
  };

  const valueColorClasses = {
    default: 'text-gray-800',
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4 shadow-sm`}>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${valueColorClasses[color]}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
