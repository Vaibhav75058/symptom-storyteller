import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIGHT_PALETTE = {
  bg: '#F7F6F3',
  card: '#FFFFFF',
  text: '#1A1A18',
  subtext: '#888780',
  border: '#F0EFE8',
  input: '#F1EFE8',
  inputText: '#1A1A18',
  accent: '#BA7517',
  accentLight: '#FFE6CD',
  accentBg: '#FFF3E8',
  tabBar: '#FFFFFF',
  tabBorder: '#F7F6F3',
  cardHighlight: '#FAFAF8',
  success: '#16A34A',
  successBg: '#F0FDF4',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000',
};

const ThemeContext = createContext({
  isDark: false,
  colors: LIGHT_PALETTE,
  toggleTheme: () => {},
});

const DARK_PALETTE = {
  bg: '#0F0F0F',
  card: '#1C1C1E',
  text: '#E8E6E1',
  subtext: '#9A9890',
  border: '#2C2C2C',
  input: '#2A2A2A',
  inputText: '#E8E6E1',
  accent: '#D4922A',
  accentLight: '#3D2E1A',
  accentBg: '#2A2010',
  tabBar: '#1A1A1A',
  tabBorder: '#2C2C2C',
  cardHighlight: '#252525',
  success: '#22C55E',
  successBg: '#0D2818',
  danger: '#EF4444',
  dangerBg: '#2D1010',
  warning: '#EAB308',
  warningBg: '#2D2505',
  info: '#38BDF8',
  infoBg: '#0A1E2D',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: '#000',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@ss_theme').then((savedTheme) => {
      if (savedTheme === 'dark') {
        setIsDark(true);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('@ss_theme', newVal ? 'dark' : 'light');
  };

  const colors = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
