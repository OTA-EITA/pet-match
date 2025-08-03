# PetMatch React Native App

里親マッチングアプリのReact Nativeフロントエンド

## 特徴

- **ペット一覧表示**: Kubernetes API Gateway経由でペット情報を取得
- **美しいUI**: モダンなカードデザイン
- **TypeScript対応**: 型安全な開発
- **Pull to Refresh**: データ更新機能
- **エラーハンドリング**: 通信エラー時の適切な表示

## 技術スタック

- React Native (Expo)
- TypeScript
- React Navigation
- Axios
- API Gateway連携

## セットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- Expo CLI
- API Gateway が http://localhost:8080 で稼働中

### インストール
```bash
cd frontend
npm install

# または
yarn install
```

### 開発実行
```bash
# Expo開発サーバー起動
npm start

# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web ブラウザ
npm run web
```

## 🔗 API連携

### エンドポイント
- **Base URL**: `http://localhost:8080/api/v1`
- **ペット一覧**: `GET /pets`
- **ペット詳細**: `GET /pets/:id`

### API Gateway 確認
```bash
# ヘルスチェック
curl http://localhost:8080/health

# ペット一覧
curl http://localhost:8080/api/v1/pets
```

## プロジェクト構造

```
frontend/
├── src/
│   ├── api/           # API クライアント
│   ├── components/    # 再利用可能コンポーネント
│   ├── screens/       # 画面コンポーネント
│   └── types/         # TypeScript 型定義
├── App.tsx            # メインアプリ
├── package.json
└── README.md
```

## 実装済み機能

- ペット一覧表示
- プルリフレッシュ
- エラーハンドリング
- ローディング状態
- レスポンシブデザイン
- TypeScript型安全性

## 開発ワークフロー

1. **API Gateway起動**: `kubectl port-forward service/api-gateway 8080:8080 -n petmatch`
2. **React Native起動**: `npm start`
3. **動作確認**: シミュレーター/エミュレーターでアプリ確認

## トラブルシューティング

### API接続エラー
- API Gatewayが起動しているか確認
- port-forwardが動作しているか確認
- localhost:8080にアクセス可能か確認

### メトロバンドラーエラー
```bash
# キャッシュクリア
npx expo start --clear
```

## UI/UX

- **カラーパレット**: 
  - プライマリ: #2196F3 (青)
  - 成功: #4CAF50 (緑)
  - 警告: #FF9800 (オレンジ)
- **アイコン**: 絵文字を使用したフレンドリーなデザイン
- **レスポンシブ**: iOS/Android両対応

---

**Next**: ペット詳細画面、マッチング機能、認証機能の実装
