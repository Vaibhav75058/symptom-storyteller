import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/CameraScreen';
import ScanPreviewScreen from '../screens/ScanPreviewScreen';
import TriageResultScreen from '../screens/TriageResultScreen';

const Stack = createNativeStackNavigator();

export default function ScanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="ScanPreview" component={ScanPreviewScreen} />
      <Stack.Screen name="TriageResult" component={TriageResultScreen} />
    </Stack.Navigator>
  );
}
