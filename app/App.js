import 'react-native-gesture-handler';
import './global.css';

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import { LanguageProvider } from './src/hooks/useLanguage';
import { ThemeProvider } from './src/hooks/useTheme';
import { registerNotificationCategories, scheduleDailyHealthTip } from './src/services/notificationService';
import { saveDoseLog, updateRemainingQuantity } from './src/services/medicineReminderService';
import { auth } from './src/services/firebaseConfig';

// Import expo-notifications directly now that we've bypassed the Expo Go check
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications load error:', e.message);
}

// Expo Google Fonts
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

export default function App() {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    // Safely setup notifications with fallbacks for Expo Go
    try {
      registerNotificationCategories().catch((e) => {
        console.warn('Notification category registration skipped:', e.message);
      });
      scheduleDailyHealthTip(false).catch((e) => {
        console.warn('Daily tip scheduling skipped:', e.message);
      });
    } catch (err) {
      console.warn('Expo notifications skipped on startup:', err.message);
    }

    // Setup Notification listener for actions
    let subscription = null;
    if (Notifications) {
      try {
        subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
          const { actionIdentifier, notification } = response;
          const data = notification.request.content.data;

          if (data && data.type === 'medicine_alarm' && data.reminderId) {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userId = currentUser.uid;
            const todayStr = new Date().toISOString().split('T')[0];
            
            let status = 'pending';
            if (actionIdentifier === 'take') {
              status = 'taken';
            } else if (actionIdentifier === 'skip') {
              status = 'skipped';
            } else if (actionIdentifier === 'snooze') {
              // Snooze: Schedule new local alert in 10 minutes
              const trigger = new Date(Date.now() + 10 * 60 * 1000);
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `⏰ Snooze: ${data.medicineName}`,
                  body: `Snoozed dose of ${data.medicineName} is due now.`,
                  data: data,
                  categoryIdentifier: 'medicine_reminder',
                  sound: true,
                },
                trigger,
              });
              return;
            }

            if (status !== 'pending') {
              const logKey = `${data.reminderId}_${todayStr}_${data.time.replace(':', '')}`;
              const log = {
                id: logKey,
                reminderId: data.reminderId,
                medicineName: data.medicineName,
                date: todayStr,
                time: data.time,
                status: status,
              };
              await saveDoseLog(userId, log);
              
              if (status === 'taken' && data.remainingQuantity != null) {
                await updateRemainingQuantity(userId, data.reminderId, Math.max(0, data.remainingQuantity - 1));
              }
            }
          }
        });
      } catch (listenerError) {
        console.warn('Could not add notification response listener:', listenerError.message);
      }
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null; // Keep splash screen visible while fonts load
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
