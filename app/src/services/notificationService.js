import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// Mock isRunningInExpoGo to return false to prevent expo-notifications from crashing on startup in Expo Go
import * as Expo from 'expo';
try {
  Object.defineProperty(Expo, 'isRunningInExpoGo', {
    value: () => false,
    writable: true,
    configurable: true
  });
} catch (e) {
  try {
    Expo.isRunningInExpoGo = () => false;
  } catch (err) {}
}

// Mock Constants.appOwnership BEFORE importing expo-notifications to bypass Expo Go's remote notification block
import Constants from 'expo-constants';
try {
  Object.defineProperty(Constants, 'appOwnership', {
    get: () => 'standalone',
    configurable: true
  });
} catch (e) {
  try {
    Constants.appOwnership = 'standalone';
  } catch (err) {}
}

// Try to import expo-notifications dynamically to avoid module evaluation crashes in Expo Go
let Notifications = null;
try {
  Notifications = require('expo-notifications');
  
  // Set notification handler safely
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('expo-notifications could not be loaded dynamically in Expo Go:', e.message);
}

const HEALTH_TIPS = [
  {
    en: 'Drink 8 glasses of water daily to stay hydrated and keep your kidneys healthy.',
    hi: 'स्वस्थ रहने और गुर्दे ठीक रखने के लिए रोज़ाना कम से कम 8 गिलास पानी पीएं।'
  },
  {
    en: 'A 30-minute brisk walk daily can improve cardiovascular health and boost mood.',
    hi: 'रोज़ 30 मिनट तेज़ चलने से हृदय स्वास्थ्य में सुधार होता है और मूड अच्छा होता है।'
  },
  {
    en: 'Prioritize 7-8 hours of sleep to help your body recover, repair, and recharge.',
    hi: 'शरीर को ठीक होने और ऊर्जावान बने रहने के लिए 7-8 घंटे की नींद ज़रूर लें।'
  },
  {
    en: 'Reduce salt intake to manage blood pressure levels effectively.',
    hi: 'रक्तचाप (BP) को नियंत्रित रखने के लिए खाने में नमक की मात्रा कम करें।'
  },
  {
    en: 'Eat fresh fruits and vegetables daily for essential vitamins and antioxidants.',
    hi: 'आवश्यक विटामिन और एंटीऑक्सीडेंट के लिए ताज़े फल और सब्ज़ियां खाएं।'
  },
  {
    en: 'Take a 5-minute break every hour to stretch your body and rest your eyes.',
    hi: 'हर घंटे में 5 minute का break लें, शरीर को stretch करें और आंखों को आराम दें।'
  },
  {
    en: 'Limit processed and sugary foods to maintain a healthy weight and blood sugar.',
    hi: 'वज़न और ब्लड शुगर को नियंत्रित रखने के लिए पैकेटबंद और मीठी चीज़ों से परहेज़ करें।'
  },
  {
    en: 'Practice deep breathing for 5 minutes daily to reduce stress levels.',
    hi: 'तनाव कम करने के लिए रोज़ाना 5 मिनट गहरी सांस लेने का अभ्यास (प्राणायाम) करें।'
  },
  {
    en: 'Do not self-medicate; always consult a doctor before taking antibiotics.',
    hi: 'बिना डॉक्टर की सलाह के खुद कोई दवाई या एंटीबायोटिक न लें।'
  },
  {
    en: 'Include protein-rich foods like lentils, eggs, or paneer in your meals.',
    hi: 'अपने भोजन में प्रोटीन से भरपूर चीज़ें जैसे दाल, अंडा या पनीर शामिल करें।'
  }
];

/**
 * Request permission for local notifications
 */
export const requestNotificationPermissions = async () => {
  if (!Notifications) return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('requestNotificationPermissions failed:', e.message);
    return false;
  }
};

/**
 * Register categories for Notification Action Buttons (Take Now, Snooze, Skip)
 */
export const registerNotificationCategories = async () => {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync('medicine_reminder', [
      {
        identifier: 'take',
        buttonTitle: '✅ Take Now',
        options: { opensAppToResponse: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: '⏰ Snooze 10 Min',
        options: { opensAppToResponse: false },
      },
      {
        identifier: 'skip',
        buttonTitle: '❌ Skip',
        options: { opensAppToResponse: false },
      },
    ]);
  } catch (e) {
    console.warn('registerNotificationCategories failed:', e.message);
  }
};

/**
 * Schedule daily repeating notification for medicine reminder
 */
export const scheduleMedicineNotification = async (reminder) => {
  if (!Notifications) return [];
  if (!reminder.times || reminder.times.length === 0) return [];

  const isGranted = await requestNotificationPermissions();
  if (!isGranted) return [];

  const scheduledIds = [];
  try {
    for (let i = 0; i < reminder.times.length; i++) {
      const timeStr = reminder.times[i];
      const [h, m] = timeStr.split(':').map(Number);

      const trigger = {
        hour: h,
        minute: m,
        repeats: true,
      };

      const title = reminder.medicineName;
      const body = `Time to take ${reminder.dosage || '1'} ${reminder.dosageUnit || 'dose'} of ${reminder.medicineName}. (${reminder.description || ''})`;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: {
            reminderId: reminder.id,
            medicineName: reminder.medicineName,
            time: timeStr,
            type: 'medicine_alarm',
          },
          categoryIdentifier: 'medicine_reminder',
          sound: true,
        },
        trigger,
      });
      scheduledIds.push(id);
    }
  } catch (e) {
    console.error('Failed to schedule medicine notification:', e);
  }

  return scheduledIds;
};

/**
 * Cancel scheduled notifications
 */
export const cancelMedicineNotification = async (notificationIds) => {
  if (!Notifications) return;
  if (!notificationIds || notificationIds.length === 0) return;
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (e) {
    console.error('Failed to cancel notifications:', e);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllMedicineNotifications = async () => {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('Failed to cancel all notifications:', e);
  }
};

/**
 * Schedule a one-time notification for refilling medicine
 */
export const scheduleRefillReminder = async (medicineName, remainingQty) => {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Refill Reminder',
        body: `Only ${remainingQty} of ${medicineName} remaining. Refill soon!`,
        sound: true,
      },
      trigger: null, // instant
    });
  } catch (e) {
    console.error('Failed to schedule refill notification:', e);
  }
};

/**
 * Speak medicine reminder aloud
 */
export const speakMedicineReminder = async (medicineName, isHindi = false) => {
  try {
    const text = isHindi
      ? `दवाई लेने का समय हो गया है। कृपया अपनी दवाई ${medicineName} लें।`
      : `It is time to take your medicine, ${medicineName}.`;
    
    Speech.speak(text, {
      language: isHindi ? 'hi-IN' : 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  } catch (e) {
    console.error('Text-to-speech error:', e);
  }
};

/**
 * Schedule daily health tip at 9 AM
 */
export const scheduleDailyHealthTip = async (isHindi = false) => {
  if (!Notifications) return;
  try {
    const isGranted = await requestNotificationPermissions();
    if (!isGranted) return;

    const randomTipObj = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
    const tipText = isHindi ? randomTipObj.hi : randomTipObj.en;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isHindi ? '💡 आज का स्वास्थ्य सुझाव' : '💡 Daily Health Tip',
        body: tipText,
        data: { type: 'health_tip' },
        sound: true,
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  } catch (e) {
    console.error('Failed to schedule daily health tip:', e);
  }
};

/**
 * Get all health tips
 */
export const getHealthTips = () => HEALTH_TIPS;
