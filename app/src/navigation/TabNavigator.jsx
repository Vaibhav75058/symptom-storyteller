import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScanNavigator from './ScanNavigator';
import { Home, MessageCircle, Camera, Stethoscope, User } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          elevation: 5,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Chat') return <MessageCircle color={color} size={size} />;
          if (route.name === 'Scan') return <Camera color={color} size={size} />;
          if (route.name === 'Doctors') return <Stethoscope color={color} size={size} />;
          if (route.name === 'Profile') return <User color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Scan" component={ScanNavigator} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
