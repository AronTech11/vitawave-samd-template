import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from '../screens/Admin/Dashboard';
import PatientView from '../screens/Admin/PatientView';

export type AdminTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  PatientView: { patientId: number };
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          title: 'Admin Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientView}
        options={{
          title: 'Patients',
          tabBarLabel: 'Patients',
        }}
      />
    </Tab.Navigator>
  );
};

const AdminStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen
        name="PatientView"
        component={PatientView}
        options={{
          headerShown: true,
          title: 'Patient Details',
        }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;
