import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API設定
 *
 * 開発環境と本番環境でAPIのベースURLを切り替えます。
 * 環境変数を使用して柔軟に設定できます。
 */

/**
 * APIのベースURLを取得
 *
 * - 開発環境:
 *   - Android Emulator: 10.0.2.2 (エミュレータからホストマシンへのアクセス)
 *   - iOS Simulator/実機: 環境変数で指定されたホストIP、またはデフォルトのlocalhostを使用
 * - 本番環境: 環境変数で指定されたAPI URLを使用
 */
export const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // 開発環境
    const apiHost = Constants.expoConfig?.extra?.apiHost || 'localhost';
    const apiPort = Constants.expoConfig?.extra?.apiPort || '18081';

    if (Platform.OS === 'android') {
      // Androidエミュレータの場合、10.0.2.2でホストマシンにアクセス
      return `http://10.0.2.2:${apiPort}/api`;
    }

    // iOS Simulatorまたは実機の場合
    return `http://${apiHost}:${apiPort}/api`;
  }

  // 本番環境
  const productionApiUrl = Constants.expoConfig?.extra?.productionApiUrl || 'https://api.onlycats.example.com/api';
  return productionApiUrl;
};

/**
 * API設定
 */
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};
