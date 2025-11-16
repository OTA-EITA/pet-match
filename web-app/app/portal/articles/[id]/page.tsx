'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // TODO: APIから取得
  const article = {
    id,
    title: '初めて猫を飼う方へ - 必要なもの完全ガイド',
    category: '飼育ガイド',
    author: 'OnlyCats編集部',
    publishedDate: '2024-11-01',
    readTime: '5分',
    content: `
# 猫を迎える前の準備

猫を家族に迎えることは、とても素敵な決断です。しかし、猫が快適に暮らせる環境を整えるためには、事前の準備が大切です。

## 必要なアイテム

### 1. トイレ関連

猫用トイレは必須アイテムです。大きめのものを選び、猫砂は猫が好む種類を見つけましょう。

- トイレ本体（屋根付き or オープン型）
- 猫砂（鉱物系、紙系、木系など）
- トイレスコップ
- 消臭スプレー

### 2. 食事関連

- フードボウル（陶器製がおすすめ）
- 水入れ（自動給水器も便利）
- キャットフード（年齢に合ったもの）
- おやつ

### 3. 寝床

猫は1日の大半を寝て過ごします。快適な寝床を用意しましょう。

- ベッド or クッション
- ブランケット
- キャットタワー（あると喜びます）

### 4. お手入れグッズ

- ブラシ or コーム
- 爪切り
- 爪とぎ器

### 5. 遊び道具

運動不足解消とストレス発散のため、おもちゃは必須です。

- ねこじゃらし
- ボール
- トンネル

## 心構え

猫を迎えるということは、10年以上の長い付き合いになります。以下の点を心に留めておきましょう：

1. **定期的な健康診断**: 年1回は動物病院で検診を
2. **適切な食事管理**: 肥満に注意
3. **十分な遊び時間**: 毎日15分以上は遊んであげましょう
4. **清潔な環境**: トイレは毎日掃除
5. **愛情**: たくさんの愛情を注いであげてください

## まとめ

猫との暮らしは、準備をしっかりすることで、より豊かで楽しいものになります。焦らず、じっくりと準備を進めていきましょう。

何か困ったことがあれば、獣医師や経験豊富な猫の飼い主に相談することをおすすめします。
    `,
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/portal"
            className="inline-flex items-center text-neutral-600 hover:text-primary-600 transition touchable"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            猫図鑑に戻る
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ヘッダー情報 */}
        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-secondary-600 bg-secondary-100 px-3 py-1 rounded-lg">
              {article.category}
            </span>
            <span className="text-xs text-neutral-500">⏱️ {article.readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center text-sm text-neutral-600">
            <span className="mr-4">✍️ {article.author}</span>
            <span>📅 {new Date(article.publishedDate).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        {/* サムネイル画像 */}
        <div className="card mb-6 overflow-hidden">
          <div className="aspect-[16/9] bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
            <div className="text-9xl">📖</div>
          </div>
        </div>

        {/* 記事本文 */}
        <div className="card p-6 sm:p-8">
          <div className="prose prose-neutral max-w-none">
            <div className="text-neutral-800 leading-relaxed space-y-6">
              {article.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold text-neutral-900 mt-8 mb-4">{paragraph.replace('# ', '')}</h1>;
                } else if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold text-neutral-900 mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                } else if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold text-neutral-900 mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
                } else if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={index} className="list-disc list-inside space-y-1 ml-4">
                      {paragraph.split('\n').map((item, i) => (
                        <li key={i}>{item.replace('- ', '')}</li>
                      ))}
                    </ul>
                  );
                } else if (paragraph.match(/^\d+\./)) {
                  return (
                    <ol key={index} className="list-decimal list-inside space-y-1 ml-4">
                      {paragraph.split('\n').map((item, i) => (
                        <li key={i}>{item.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                  );
                } else {
                  return <p key={index}>{paragraph}</p>;
                }
              })}
            </div>
          </div>
        </div>

        {/* 関連記事（将来的に） */}
        <div className="mt-8 card p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">関連記事</h2>
          <div className="text-center py-6 text-neutral-500">
            他の記事も準備中です 📚
          </div>
        </div>
      </article>
    </div>
  );
}
