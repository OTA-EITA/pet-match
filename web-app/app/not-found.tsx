import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">😿</div>
        <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-neutral-800 mb-3">
          ページが見つかりません
        </h2>
        <p className="text-neutral-600 mb-8 leading-relaxed">
          お探しのページは存在しないか、<br />
          移動または削除された可能性があります
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition touchable"
          >
            トップページへ
          </Link>
          <Link
            href="/cats"
            className="inline-block bg-white border-2 border-primary-500 text-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition touchable"
          >
            猫を探す
          </Link>
        </div>
      </div>
    </div>
  );
}
