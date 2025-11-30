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
    const apiHost = Constants.expoConfig?.extra?.apiHost || '192.168.3.5';
    const apiPort = Constants.expoConfig?.extra?.apiPort || '8080';

    console.log('Platform.OS:', Platform.OS);
    console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);

    if (Platform.OS === 'web') {
      // Webブラウザの場合はlocalhostを使用
      const url = `http://localhost:${apiPort}/api`;
      console.log('API Base URL (web):', url);
      return url;
    }

    if (Platform.OS === 'android') {
      // Androidエミュレータの場合、10.0.2.2でホストマシンにアクセス
      return `http://10.0.2.2:${apiPort}/api`;
    }

    // iOS Simulator/実機の場合
    const url = `http://${apiHost}:${apiPort}/api`;
    console.log('API Base URL (ios):', url);
    return url;
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
