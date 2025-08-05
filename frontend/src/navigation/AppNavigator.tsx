import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

// Screens
import PetListScreen from '../screens/PetListScreen';
import PetDetailScreen from '../screens/PetDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PetList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 2,
            shadowOpacity: 0.1,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 2 },
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#333',
          },
          headerTintColor: '#2196F3',
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="PetList"
          component={PetListScreen}
          options={{
            title: '里親募集中のペット',
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="PetDetail"
          component={PetDetailScreen}
          options={{
            title: 'ペット詳細',
            headerBackTitle: '戻る',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;