import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock Ad Banner - placeholder for Google AdMob
// To enable real ads in production:
// 1. npm install react-native-google-mobile-ads --legacy-peer-deps
// 2. Configure app.json with your AdMob app IDs
// 3. Use EAS Build (not Expo Go) to create production builds
const AdBanner: React.FC = () => {
  return (
    <View style={styles.mockContainer}>
      <Text style={styles.mockLabel}>AD</Text>
      <Text style={styles.mockText}>Google AdMob Banner</Text>
      <Text style={styles.mockSubtext}>Production build required</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  mockContainer: {
    height: 60,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    width: '90%',
    alignSelf: 'center',
  },
  mockLabel: {
    position: 'absolute',
    top: 4,
    left: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  mockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  mockSubtext: {
    fontSize: 10,
    color: '#999',
  },
});

export default AdBanner;
