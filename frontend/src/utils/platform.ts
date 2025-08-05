import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const webStyles = isWeb ? {
  // Web用のスクロール対応
  scrollView: {
    WebkitOverflowScrolling: 'touch' as any,
    overflowY: 'auto' as any,
    height: '100vh' as any,
  },
  container: {
    height: '100vh' as any,
    overflow: 'hidden' as any,
  }
} : {};

export const getScrollViewStyle = (baseStyle: any) => {
  if (isWeb) {
    return [
      baseStyle,
      {
        WebkitOverflowScrolling: 'touch' as any,
        overflowY: 'auto' as any,
      }
    ];
  }
  return baseStyle;
};
