import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import MedicineScannerScreen from '../screens/MedicineScannerScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import HealthDashboardScreen from '../screens/HealthDashboardScreen';
import MedicineReminderScreen from '../screens/MedicineReminderScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import MedicineHistoryScreen from '../screens/MedicineHistoryScreen';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MedicineScanner" component={MedicineScannerScreen} />
      <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
      <Stack.Screen name="Doctors" component={DoctorsScreen} />
      <Stack.Screen name="HealthDashboard" component={HealthDashboardScreen} />
      <Stack.Screen name="MedicineReminder" component={MedicineReminderScreen} />
      <Stack.Screen name="AddMedicine" component={AddMedicineScreen} />
      <Stack.Screen name="MedicineHistory" component={MedicineHistoryScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#BA7517" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
