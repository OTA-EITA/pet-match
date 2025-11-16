'use client';

import Link from 'next/link';

interface Breed {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  characteristics: string[];
  origin: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
}

export default function PortalPage() {
  // モックデータ
  const breeds: Breed[] = [
    {
      id: '1',
      name: 'アメリカンショートヘア',
      nameEn: 'American Shorthair',
      description: '人懐っこく、家族向けの猫',
      characteristics: ['社交的', '遊び好き', '丈夫'],
      origin: 'アメリカ',
    },
    {
      id: '2',
      name: 'スコティッシュフォールド',
      nameEn: 'Scottish Fold',
      description: '折れ耳が特徴的な愛らしい猫',
      characteristics: ['おとなしい', '甘えん坊', '穏やか'],
      origin: 'スコットランド',
    },
    {
      id: '3',
      name: 'ラグドール',
      nameEn: 'Ragdoll',
      description: '抱っこが大好きな大型猫',
      characteristics: ['穏やか', '人懐っこい', '大型'],
      origin: 'アメリカ',
    },
    {
      id: '4',
      name: 'ノルウェージャンフォレストキャット',
      nameEn: 'Norwegian Forest Cat',
      description: '北欧の森林出身の長毛種',
      characteristics: ['活発', '賢い', '長毛'],
      origin: 'ノルウェー',
    },
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: '初めて猫を飼う方へ - 必要なもの完全ガイド',
      category: '飼育ガイド',
      excerpt: '猫を迎える前に準備すべきアイテムと心構えを解説します。',
      readTime: '5分',
    },
    {
      id: '2',
      title: '猫の健康管理 - 定期検診のすすめ',
      category: '健康',
      excerpt: '愛猫の健康を守るための定期検診の重要性とチェックポイント。',
      readTime: '7分',
    },
    {
      id: '3',
      title: '多頭飼いを成功させるコツ',
      category: '飼育ガイド',
      excerpt: '複数の猫を飼う際の注意点と仲良く暮らすための工夫。',
      readTime: '6分',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-primary-400 to-accent-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            📚 猫図鑑・飼育ガイド
          </h1>
          <p className="text-base sm:text-lg text-primary-50">
            猫種の特徴から飼育方法まで、猫との暮らしに役立つ情報をお届けします
          </p>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 猫種図鑑セクション */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              人気の猫種
            </h2>
            <Link
              href="/portal/breeds"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base touchable"
            >
              すべて見る →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {breeds.map((breed) => (
              <Link
                key={breed.id}
                href={`/portal/breeds/${breed.id}`}
                className="card group cursor-pointer hover:shadow-card-hover transition-all touchable"
              >
                {/* 猫種画像（モック） */}
                <div className="aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                  <div className="text-6xl">😺</div>
                </div>

                {/* 猫種情報 */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">
                    {breed.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-2">{breed.nameEn}</p>
                  <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                    {breed.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {breed.characteristics.slice(0, 2).map((char) => (
                      <span
                        key={char}
                        className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-md"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 飼育ガイド・記事セクション */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              飼育ガイド・記事
            </h2>
            <Link
              href="/portal/articles"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base touchable"
            >
              すべて見る →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/portal/articles/${article.id}`}
                className="card group cursor-pointer hover:shadow-card-hover transition-all touchable"
              >
                {/* 記事サムネイル（モック） */}
                <div className="aspect-[16/9] bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
                  <div className="text-5xl">📖</div>
                </div>

                {/* 記事情報 */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-secondary-600 bg-secondary-50 px-2 py-1 rounded-md">
                      {article.category}
                    </span>
                    <span className="text-xs text-neutral-500">
                      ⏱️ {article.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition">
                    {article.title}
                  </h3>
                  <p className="text-sm text-neutral-600 line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* カテゴリー一覧 */}
        <section className="mt-12 bg-white rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-6">
            カテゴリーから探す
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: '🐱', name: '猫種図鑑', count: 50 },
              { icon: '🏥', name: '健康管理', count: 23 },
              { icon: '🍖', name: '食事・栄養', count: 18 },
              { icon: '🎾', name: 'しつけ・遊び', count: 15 },
              { icon: '🏠', name: '住環境', count: 12 },
              { icon: '💰', name: '費用・保険', count: 8 },
              { icon: '👶', name: '子猫の育て方', count: 20 },
              { icon: '👴', name: 'シニア猫', count: 10 },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/portal/category/${category.name}`}
                className="flex flex-col items-center p-4 rounded-xl bg-neutral-50 hover:bg-primary-50 transition touchable"
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <div className="text-sm font-semibold text-neutral-900 mb-1">
                  {category.name}
                </div>
                <div className="text-xs text-neutral-500">{category.count}記事</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
