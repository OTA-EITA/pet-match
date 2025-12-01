import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Web向けのスクロール設定
    if (Platform.OS === 'web') {
      // body/htmlのoverflow設定
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          overflow: hidden;
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        #root {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <View style={styles.container}>
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : undefined,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
    backgroundColor: '#FFF9F0',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }),
  } as any,
});
