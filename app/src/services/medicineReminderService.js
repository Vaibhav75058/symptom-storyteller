import { db } from './firebaseConfig';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_CACHE_PREFIX = '@ss_reminders_';
const DOSE_LOGS_CACHE_PREFIX = '@ss_dose_logs_';

const getRemindersCacheKey = (userId) => `${REMINDERS_CACHE_PREFIX}${userId}`;
const getDoseLogsCacheKey = (userId) => `${DOSE_LOGS_CACHE_PREFIX}${userId}`;

/**
 * Save medicine reminder
 */
export const saveReminder = async (userId, reminder) => {
  if (!userId) return false;
  const reminderId = reminder.id || Date.now().toString();
  const fullReminder = {
    ...reminder,
    id: reminderId,
    createdAt: reminder.createdAt || new Date().getTime(),
    active: reminder.active !== undefined ? reminder.active : true,
  };

  try {
    // 1. Save to Firestore under user subcollection: users/{userId}/reminders/{reminderId}
    const docRef = doc(db, 'users', userId, 'reminders', reminderId);
    setDoc(docRef, fullReminder).catch((err) => {
      console.warn('Firestore Reminder Write Failed (Fallback used):', err.message);
    });

    // 2. Save to cache
    const cacheKey = getRemindersCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    let reminders = [];
    if (cachedString) {
      reminders = JSON.parse(cachedString);
    }
    const idx = reminders.findIndex(r => r.id === reminderId);
    if (idx >= 0) {
      reminders[idx] = fullReminder;
    } else {
      reminders.push(fullReminder);
    }
    await AsyncStorage.setItem(cacheKey, JSON.stringify(reminders));
    return fullReminder;
  } catch (e) {
    console.error('saveReminder error:', e);
    return false;
  }
};

/**
 * Get all reminders for a user
 */
export const getUserReminders = async (userId) => {
  if (!userId) return [];
  const cacheKey = getRemindersCacheKey(userId);

  try {
    const colRef = collection(db, 'users', userId, 'reminders');
    const querySnapshot = await getDocs(colRef);
    const reminders = [];
    querySnapshot.forEach((doc) => {
      reminders.push(doc.data());
    });

    await AsyncStorage.setItem(cacheKey, JSON.stringify(reminders));
    return reminders;
  } catch (err) {
    console.warn('Firestore reminders fetch failed, using cache:', err.message);
    try {
      const cachedString = await AsyncStorage.getItem(cacheKey);
      if (cachedString) {
        return JSON.parse(cachedString);
      }
    } catch (e) {
      console.error('Cache read error for reminders:', e);
    }
  }
  return [];
};

/**
 * Delete a medicine reminder
 */
export const deleteReminder = async (userId, reminderId) => {
  if (!userId || !reminderId) return false;

  try {
    const docRef = doc(db, 'users', userId, 'reminders', reminderId);
    deleteDoc(docRef).catch((err) => {
      console.warn('Firestore Reminder Delete Failed (Fallback used):', err.message);
    });

    const cacheKey = getRemindersCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    if (cachedString) {
      let reminders = JSON.parse(cachedString);
      reminders = reminders.filter(r => r.id !== reminderId);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(reminders));
    }
    return true;
  } catch (e) {
    console.error('deleteReminder error:', e);
    return false;
  }
};

/**
 * Enable/disable a medicine reminder
 */
export const toggleReminder = async (userId, reminderId, active) => {
  if (!userId || !reminderId) return false;
  try {
    const reminders = await getUserReminders(userId);
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.active = active;
      await saveReminder(userId, reminder);
      return true;
    }
  } catch (e) {
    console.error('toggleReminder error:', e);
  }
  return false;
};

/**
 * Update remaining quantity
 */
export const updateRemainingQuantity = async (userId, reminderId, qty) => {
  if (!userId || !reminderId) return false;
  try {
    const reminders = await getUserReminders(userId);
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.remainingQuantity = Math.max(0, qty);
      await saveReminder(userId, reminder);
      return true;
    }
  } catch (e) {
    console.error('updateRemainingQuantity error:', e);
  }
  return false;
};

/**
 * Save dose confirmation log
 */
export const saveDoseLog = async (userId, log) => {
  if (!userId) return false;
  const logId = log.id || `${log.reminderId}_${log.date}_${log.time.replace(':', '')}`;
  const fullLog = {
    ...log,
    id: logId,
    loggedAt: new Date().getTime(),
  };

  try {
    const docRef = doc(db, 'users', userId, 'doseLogs', logId);
    setDoc(docRef, fullLog).catch((err) => {
      console.warn('Firestore DoseLog Write Failed (Fallback used):', err.message);
    });

    const cacheKey = getDoseLogsCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    let logs = [];
    if (cachedString) {
      logs = JSON.parse(cachedString);
    }
    const idx = logs.findIndex(l => l.id === logId);
    if (idx >= 0) {
      logs[idx] = fullLog;
    } else {
      logs.unshift(fullLog);
    }
    await AsyncStorage.setItem(cacheKey, JSON.stringify(logs));
    return true;
  } catch (e) {
    console.error('saveDoseLog error:', e);
    return false;
  }
};

/**
 * Get dose logs
 */
export const getDoseHistory = async (userId, days = 7) => {
  if (!userId) return [];
  const cacheKey = getDoseLogsCacheKey(userId);

  try {
    const colRef = collection(db, 'users', userId, 'doseLogs');
    const querySnapshot = await getDocs(colRef);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data());
    });

    logs.sort((a, b) => b.loggedAt - a.loggedAt);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.warn('Firestore dose logs fetch failed, using cache:', err.message);
    try {
      const cachedString = await AsyncStorage.getItem(cacheKey);
      if (cachedString) {
        const logs = JSON.parse(cachedString);
        logs.sort((a, b) => b.loggedAt - a.loggedAt);
        return logs;
      }
    } catch (e) {
      console.error('Cache read error for dose logs:', e);
    }
  }
  return [];
};

/**
 * Get all doses due today, cross-referenced with today's dose logs
 */
export const getTodaysDoses = async (userId) => {
  if (!userId) return [];
  
  const reminders = await getUserReminders(userId);
  const activeReminders = reminders.filter(r => r.active);
  const history = await getDoseHistory(userId, 1);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDoses = [];

  const todayDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[todayDayOfWeek];

  for (const reminder of activeReminders) {
    // Check if within date range
    const nowMs = Date.now();
    if (reminder.startDate && new Date(reminder.startDate).getTime() > nowMs) continue;
    if (reminder.endDate && new Date(reminder.endDate).getTime() < nowMs - 86400000) continue;

    // Check repeat options
    let isDueToday = true;
    if (reminder.repeatOption === 'Specific Days') {
      if (reminder.repeatDays && !reminder.repeatDays.includes(todayDayName)) {
        isDueToday = false;
      }
    } else if (reminder.repeatOption === 'Alternate Days') {
      const startMs = new Date(reminder.startDate || reminder.createdAt).getTime();
      const diffDays = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
      if (diffDays % 2 !== 0) {
        isDueToday = false;
      }
    } else if (reminder.repeatOption === 'Weekly') {
      const startDay = new Date(reminder.startDate || reminder.createdAt).getDay();
      if (startDay !== todayDayOfWeek) {
        isDueToday = false;
      }
    }

    if (!isDueToday) continue;

    for (const time of reminder.times) {
      const logKey = `${reminder.id}_${todayStr}_${time.replace(':', '')}`;
      const log = history.find(l => l.id === logKey);
      
      todayDoses.push({
        id: logKey,
        reminderId: reminder.id,
        medicineName: reminder.medicineName,
        description: reminder.description,
        dosage: reminder.dosage,
        dosageUnit: reminder.dosageUnit,
        medicineType: reminder.medicineType,
        time: time,
        date: todayStr,
        status: log ? log.status : 'pending', // pending, taken, missed, skipped
        voiceReminder: reminder.voiceReminder,
        caretakerName: reminder.caretakerName,
        caretakerPhone: reminder.caretakerPhone,
        remainingQuantity: reminder.remainingQuantity,
      });
    }
  }

  // Sort today's doses chronologically by time
  todayDoses.sort((a, b) => a.time.localeCompare(b.time));
  return todayDoses;
};
