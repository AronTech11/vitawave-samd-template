import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Patient/HomeScreen';
import HistoryScreen from '../screens/Patient/HistoryScreen';
import DetailsScreen from '../screens/Patient/DetailsScreen';
import BLEPairingScreen from '../screens/Device/BLEPairingScreen';

export type PatientTabParamList = {
  Home: undefined;
  History: undefined;
  Device: undefined;
};

export type PatientStackParamList = {
  PatientTabs: undefined;
  Details: { readingId: number };
};

const Tab = createBottomTabNavigator<PatientTabParamList>();
const Stack = createNativeStackNavigator<PatientStackParamList>();

const PatientTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarLabel: 'History',
        }}
      />
      <Tab.Screen
        name="Device"
        component={BLEPairingScreen}
        options={{
          title: 'Device',
          tabBarLabel: 'Device',
        }}
      />
    </Tab.Navigator>
  );
};

const PatientStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PatientTabs" component={PatientTabs} />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{
          headerShown: true,
          title: 'Reading Details',
        }}
      />
    </Stack.Navigator>
  );
};

export default PatientStack;
