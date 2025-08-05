import { StyleSheet } from 'react-native';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const createWebCompatibleStyles = (styles: any) => {
  if (!isWeb) return styles;
  
  return StyleSheet.create({
    ...styles,
    container: {
      ...styles.container,
      height: '100vh',
      overflow: 'hidden',
    },
    scrollView: {
      ...styles.scrollView,
      height: '100%',
      WebkitOverflowScrolling: 'touch',
      overflowY: 'auto',
    }
  });
};
