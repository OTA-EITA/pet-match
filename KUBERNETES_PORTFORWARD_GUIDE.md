# PetMatch Kubernetes ポートフォワーディング ガイド

## 🌐 概要

PetMatchアプリケーションはKubernetes上でマイクロサービスアーキテクチャとして動作しています。開発・テスト環境では、各サービスにアクセスするためにポートフォワーディングが必要です。

## 🏗️ アーキテクチャ構成

```
[Web App Browser] → [API Gateway] → [Pet Service] → [Redis]
   (Port 42109)      (Port 18081)     (Port 8083)

[Static Images] ← [Pet Service]
                  (Port 8083/uploads)
```

## 📡 必要なポートフォワーディング

### 1. Web App アクセス用
```bash
# Web Appへの直接アクセス (自動設定済み)
minikube service web-app-nodeport -n petmatch
# または
kubectl port-forward service/web-app-nodeport 3000:3000 -n petmatch
```

### 2. API Gateway用 (必須)
```bash
# Web AppからのAPI呼び出し用
kubectl port-forward service/api-gateway 18081:8080 -n petmatch
```

### 3. Pet Service用 (画像配信必須)
```bash
# 画像ファイル配信用
kubectl port-forward service/pet-service 8083:8083 -n petmatch
```

## 🚀 標準起動手順

### 手順1: Minikube環境確認
```bash
# Minikubeが起動していることを確認
minikube status

# Podが全て Running であることを確認
kubectl get pods -n petmatch
```

### 手順2: 必要なポートフォワーディング起動

**ターミナル1 (API Gateway)**
```bash
kubectl port-forward service/api-gateway 18081:8080 -n petmatch
```

**ターミナル2 (Pet Service - 画像配信用)**
```bash
kubectl port-forward service/pet-service 8083:8083 -n petmatch
```

### 手順3: Web Appアクセス
```bash
# Web AppのURLを取得
minikube service web-app-nodeport -n petmatch --url

# 例: http://192.168.49.2:30000
```

## 🔗 サービス間通信フロー

### Web App起動時
1. ブラウザが Web App にアクセス (`http://<minikube-ip>:30000`)
2. Web App が API Gateway に API呼び出し (`http://localhost:18081`)
3. API Gateway が Pet Service にプロキシ (`http://pet-service:8083`)

### 画像表示時
1. Web App が画像URLを生成 (`http://localhost:8083/uploads/pets/...`)
2. ブラウザが Pet Service に直接アクセス (静的ファイル配信)

## 📋 ポート一覧表

| サービス | 内部ポート | 外部ポート | 用途 | ポートフォワード必要 |
|---------|-----------|-----------|------|-------------------|
| Web App | 3000 | 30000 | Web UI | ❌ (NodePort使用) |
| API Gateway | 8080 | 18081 | API呼び出し | ✅ 必須 |
| Pet Service | 8083 | 8083 | 画像配信 | ✅ 必須 |
| Redis | 6379 | - | データベース | ❌ (内部通信のみ) |

## 🔧 トラブルシューティング

### 問題1: 「ペット情報の取得に失敗しました」
**原因**: API Gatewayのポートフォワードが停止している
**解決策**:
```bash
kubectl port-forward service/api-gateway 18081:8080 -n petmatch
```

### 問題2: 画像が表示されない (グレーの枠のみ)
**原因**: Pet Serviceのポートフォワードが停止している
**解決策**:
```bash
kubectl port-forward service/pet-service 8083:8083 -n petmatch
```

### 問題3: 「Connection refused」エラー
**原因**: 対応するポートフォワードが動作していない
**確認方法**:
```bash
# API Gateway確認
curl http://localhost:18081/health

# Pet Service確認
curl http://localhost:8083/health
```

### 問題4: ポートフォワードが勝手に停止する
**原因**: ターミナルを閉じる、Ctrl+C、ネットワーク問題
**解決策**: 該当するポートフォワードを再起動

## 🛠️ 便利なスクリプト

### 一括ポートフォワード起動スクリプト

```bash
#!/bin/bash
# start-portforward.sh

echo "🚀 PetMatch ポートフォワード起動中..."

# API Gateway
kubectl port-forward service/api-gateway 18081:8080 -n petmatch &
API_PID=$!

# Pet Service  
kubectl port-forward service/pet-service 8083:8083 -n petmatch &
PET_PID=$!

echo "✅ ポートフォワード起動完了"
echo "API Gateway PID: $API_PID"  
echo "Pet Service PID: $PET_PID"
echo ""
echo "🌐 アクセスURL:"
echo "Web App: $(minikube service web-app-nodeport -n petmatch --url)"
echo "API Gateway: http://localhost:18081"
echo "Pet Service: http://localhost:8083"
echo ""
echo "⏹️ 停止方法:"
echo "kill $API_PID $PET_PID"
echo "または Ctrl+C"

# プロセスを前面に持ってくる
wait
```

### 使用方法
```bash
chmod +x start-portforward.sh
./start-portforward.sh
```

### 停止スクリプト

```bash
#!/bin/bash
# stop-portforward.sh

echo "⏹️ ポートフォワード停止中..."

# ポートフォワードプロセスを検索・停止
pkill -f "kubectl port-forward.*api-gateway.*18081"
pkill -f "kubectl port-forward.*pet-service.*8083"

echo "✅ 全てのポートフォワードを停止しました"
```

## 📊 ヘルスチェック・監視

### 全サービス動作確認
```bash
#!/bin/bash
# health-check.sh

echo "🏥 PetMatch ヘルスチェック"
echo "========================"

# Web App (NodePort経由)
WEB_URL=$(minikube service web-app-nodeport -n petmatch --url)
echo "Web App: $WEB_URL"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$WEB_URL" || echo "❌ 失敗"

# API Gateway  
echo "API Gateway: http://localhost:18081"
curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost:18081/health" || echo "❌ 失敗"

# Pet Service
echo "Pet Service: http://localhost:8083"  
curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost:8083/health" || echo "❌ 失敗"

echo ""
echo "📊 Pod状況:"
kubectl get pods -n petmatch
```

## 🎯 開発ワークフロー

### 日常の開発手順

1. **Minikube起動**
   ```bash
   minikube start
   ```

2. **ポートフォワード起動**
   ```bash
   ./start-portforward.sh
   ```

3. **Web App開発**
   - ブラウザで Web App にアクセス
   - API呼び出しテスト
   - 画像アップロード機能テスト

4. **コード修正・再デプロイ**
   ```bash
   # サービス再ビルド例 (Pet Service)
   eval $(minikube docker-env)
   docker build -t petmatch/pet-service:latest -f services/pet-service/Dockerfile .
   kubectl rollout restart deployment/pet-service -n petmatch
   ```

5. **終了時**
   ```bash
   ./stop-portforward.sh
   minikube stop
   ```

## 🚨 注意事項

### セキュリティ
- ポートフォワーディングは**開発・テスト専用**
- 本番環境では Ingress Controller を使用
- 認証機能は現在開発用に無効化されている

### パフォーマンス  
- ポートフォワードは追加のホップを追加するため、本番より遅い
- 大量の画像アップロード時は注意

### 制限事項
- ポートフォワードは単一クライアント向け
- 複数の開発者が同時使用する場合は NodePort を推奨

## 📚 関連コマンド

### Kubernetes管理
```bash
# Pod再起動
kubectl rollout restart deployment/<service-name> -n petmatch

# ログ確認
kubectl logs -f deployment/<service-name> -n petmatch

# Pod状況確認
kubectl get pods -n petmatch

# サービス確認
kubectl get services -n petmatch

# 設定確認
kubectl describe configmap petmatch-config -n petmatch
```

### Minikube管理
```bash
# Minikube Dashboard
minikube dashboard

# Docker環境設定
eval $(minikube docker-env)

# Minikube IP確認
minikube ip

# サービス一覧
minikube service list -n petmatch
```

## 🎉 成功の確認

全てが正常に動作している場合：

1. ✅ Web App でペット一覧が表示される
2. ✅ ペット詳細ページが開ける
3. ✅ 「画像編集」モードで画像アップロードができる
4. ✅ 画像ギャラリーで画像が正常に表示される
5. ✅ 画像削除機能が動作する

これで PetMatch アプリケーションが Kubernetes 上で完全に動作しています！

---

**作成日**: 2025年8月5日  
**対象環境**: Minikube + Docker  
**アプリケーション**: PetMatch v1.0  
**対象サービス**: Web App, API Gateway, Pet Service, Redis
