import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AuthStack from './AuthStack';
import PatientStack from './PatientStack';
import AdminStack from './AdminStack';

const RootNavigator: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Route based on user role
  if (user?.role === 'admin') {
    return <AdminStack />;
  }

  return <PatientStack />;
};

const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default Navigation;
