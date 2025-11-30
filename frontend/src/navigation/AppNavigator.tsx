import React from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import PetListScreen from '../screens/PetListScreen';
import PetDetailScreen from '../screens/PetDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import InquiryFormScreen from '../screens/InquiryFormScreen';
import InquiryHistoryScreen from '../screens/InquiryHistoryScreen';
// Shelter/Individual user screens
import PetRegisterScreen from '../screens/PetRegisterScreen';
import PetEditScreen from '../screens/PetEditScreen';
import MyPetsScreen from '../screens/MyPetsScreen';
import ReceivedInquiriesScreen from '../screens/ReceivedInquiriesScreen';

const Stack = createStackNavigator<RootStackParamList>();

const Navigation: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#333',
          },
          headerTintColor: '#2196F3',
          headerBackTitle: ' ',
          ...(Platform.OS === 'web' ? {} : TransitionPresets.SlideFromRightIOS),
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack - Not logged in
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          // Main Stack - Logged in
          <>
            <Stack.Screen
              name="PetList"
              component={PetListScreen}
              options={({ navigation }) => ({
                title: '里親募集中のペット',
                headerRight: () => (
                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="プロフィール"
                  >
                    <View style={styles.profileButtonInner}>
                      <Text style={styles.profileButtonText}>👤</Text>
                    </View>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="PetDetail"
              component={PetDetailScreen}
              options={{
                title: 'ペット詳細',
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: 'プロフィール',
              }}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              options={{
                title: 'プロフィール編集',
              }}
            />
            <Stack.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{
                title: 'お気に入り',
              }}
            />
            <Stack.Screen
              name="InquiryForm"
              component={InquiryFormScreen}
              options={{
                title: '問い合わせ',
              }}
            />
            <Stack.Screen
              name="InquiryHistory"
              component={InquiryHistoryScreen}
              options={{
                title: '問い合わせ履歴',
              }}
            />
            {/* Shelter/Individual user screens */}
            <Stack.Screen
              name="PetRegister"
              component={PetRegisterScreen}
              options={{
                title: 'ペット登録',
              }}
            />
            <Stack.Screen
              name="PetEdit"
              component={PetEditScreen}
              options={{
                title: 'ペット編集',
              }}
            />
            <Stack.Screen
              name="MyPets"
              component={MyPetsScreen}
              options={{
                title: '登録したペット',
              }}
            />
            <Stack.Screen
              name="ReceivedInquiries"
              component={ReceivedInquiriesScreen}
              options={{
                title: '受信した問い合わせ',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  profileButton: {
    marginRight: 16,
    padding: 8,
    cursor: 'pointer',
  },
  profileButtonInner: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  profileButtonText: {
    fontSize: 24,
  },
});

export default AppNavigator;