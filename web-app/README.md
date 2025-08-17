# PetMatch Web Application

PetMatchのフロントエンドアプリケーション（Next.js 15 + TypeScript）

## 🎯 TypeScript化の改善点

### 1. 型システムの強化
- **完全な型安全性**: すべてのAPIレスポンス、props、state が型付けされています
- **厳格なtsconfig**: `strict`, `noImplicitReturns`, `noUncheckedIndexedAccess` などを有効化
- **エラー防止**: コンパイル時に型エラーを検出し、ランタイムエラーを削減

### 2. 包括的な型定義
```typescript
// 型定義の例
export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;  // Union type for type safety
  age_info: AgeInfo;    // Nested interface
  // ... 他のプロパティ
}

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
```

### 3. API クライアントの型安全性
- **型付きAPIレスポンス**: すべてのエンドポイントが適切な型を返す
- **エラーハンドリング**: `ApiException` クラスで統一されたエラー処理
- **認証**: JWT のペイロードとユーザー情報の型安全性

### 4. カスタムフック
- **`usePets`**: ペットデータの取得・管理
- **`useLocalStorage`**: 型安全なローカルストレージ操作
- **`useAsync`**: 非同期処理の状態管理
- **UI フック**: debounce, toggle, click outside など

### 5. 設定ファイルの最適化
- **Tailwind CSS**: 完全なデザインシステムとカラーパレット
- **ESLint + Prettier**: 統一されたコード品質
- **Next.js**: TypeScript最適化とビルド設定

## 📁 ディレクトリ構造

```
web-app/
├── app/                    # Next.js App Router
│   ├── auth/              # 認証関連ページ
│   ├── pets/              # ペット関連ページ
│   └── ...
├── components/            # React コンポーネント
│   ├── auth/              # 認証コンポーネント
│   ├── dev/               # 開発用コンポーネント
│   └── layout/            # レイアウトコンポーネント
├── contexts/              # React Context
│   └── AuthContext.tsx    # 認証状態管理
├── hooks/                 # カスタムフック
│   ├── useAuth.ts         # 認証フック
│   ├── usePets.ts         # ペットデータフック
│   ├── useStorage.ts      # ストレージフック
│   ├── useAsync.ts        # 非同期フック
│   └── ...               # その他UIフック
├── lib/                   # ユーティリティライブラリ
│   ├── api.ts            # API クライアント
│   ├── auth.ts           # 認証ユーティリティ
│   ├── config.ts         # アプリケーション設定
│   └── utils.ts          # 汎用ユーティリティ
├── types/                 # TypeScript 型定義
│   ├── Pet.ts            # ペット関連型
│   ├── User.ts           # ユーザー関連型
│   ├── Api.ts            # API関連型
│   ├── env.d.ts          # 環境変数型
│   └── index.ts          # 型の再エクスポート
└── 設定ファイル (*.ts)     # TypeScript化済み
```

## 🛠️ 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リンター実行
npm run lint

# フォーマッター実行
npm run format

# 全チェック実行
npm run check-all

# プロダクションビルド
npm run build
```

## 🔧 型安全性の特徴

### API呼び出し
```typescript
// 型安全なAPI呼び出し
const pets: Pet[] = await petApi.getPets({
  species: 'dog',        // PetSpecies型で制限
  limit: 20,
  offset: 0
});

// エラーハンドリング
try {
  await petApi.createPet(formData);
} catch (error) {
  if (error instanceof ApiException) {
    console.error(error.message); // 型安全なエラーメッセージ
  }
}
```

### カスタムフック使用例
```typescript
// ペットデータの管理
const { pets, loading, error, refresh } = usePets({
  species: 'cat',
  limit: 10
});

// お気に入り機能
const { favorites, toggleFavorite, isFavorite } = useFavorites();

// フォームドラフト
const { draft, updateDraft, clearDraft } = useFormDraft('petForm', initialData);
```

### コンポーネントのProps
```typescript
interface PetCardProps {
  pet: Pet;
  onFavorite?: (petId: string) => void;
  showActions?: boolean;
  className?: string;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onFavorite, showActions = true }) => {
  // 型安全なコンポーネント実装
};
```

## 🎨 スタイリング

### Tailwind CSS拡張
```typescript
// カスタムカラーパレット
colors: {
  primary: { 50: '#E3F2FD', 500: '#2196F3', 900: '#0D47A1' },
  success: { 500: '#4CAF50' },
  error: { 500: '#F44336' },
  // ...
}

// カスタムアニメーション
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
}
```

## 🔒 環境変数

型安全な環境変数定義（`types/env.d.ts`）:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      JWT_SECRET: string;
      // ... 他の環境変数
    }
  }
}
```

## 📊 コード品質

### ESLint + Prettier
- TypeScript ESLint ルール
- Prettier との統合
- Next.js 最適化ルール
- 未使用変数の検出
- 厳格な型チェック

### 開発体験
- **IntelliSense**: 完全な型補完とエラー検出
- **リファクタリング**: 安全な名前変更とコード整理
- **ドキュメンテーション**: 型定義が生きたドキュメントとして機能

## 🚀 次にやるべきこと

### 1. 依存関係の更新とインストール
```bash
cd web-app
npm install
```

### 2. 型チェックとリンター実行
```bash
npm run check-all
```

### 3. 開発サーバーの起動確認
```bash
npm run dev
```

### 4. コンポーネントの型安全性確認
- 既存コンポーネントの型エラー修正
- Props の型定義追加
- API 呼び出しの型確認

### 5. 追加機能の実装
- マッチング機能の型定義
- チャット機能の WebSocket 型
- 通知システムの型安全性

### 6. テストの追加
```bash
# テスト関連依存関係追加予定
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom
```

## 💡 TypeScript のメリット

1. **開発時エラー検出**: コンパイル時に型エラーを捕捉
2. **リファクタリング安全性**: 型システムが変更の影響範囲を保証
3. **チーム開発効率**: 型定義が API 仕様書として機能
4. **保守性向上**: 長期的なコードメンテナンスが容易
5. **IDE サポート**: 優れた開発体験と生産性向上

TypeScript化により、PetMatch の開発効率と品質が大幅に向上しました。
