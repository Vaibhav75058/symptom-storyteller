import { db } from './firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HEALTH_CACHE_PREFIX = '@ss_health_logs_';

const getCacheKey = (userId) => `${HEALTH_CACHE_PREFIX}${userId}`;

/**
 * Save health log entry
 */
export const saveHealthEntry = async (userId, entry) => {
  if (!userId) return false;
  
  const entryId = entry.id || Date.now().toString();
  const fullEntry = {
    ...entry,
    id: entryId,
    createdAt: new Date().getTime(),
  };

  try {
    // 1. Save to Firestore under user subcollection: users/{userId}/healthLogs/{entryId}
    const docRef = doc(db, 'users', userId, 'healthLogs', entryId);
    setDoc(docRef, fullEntry).catch((err) => {
      console.warn('Firestore Health Write Failed (Fallback used):', err.message);
    });

    // 2. Save to local cache
    const cacheKey = getCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    let logs = [];
    if (cachedString) {
      logs = JSON.parse(cachedString);
    }
    // Update or prepend
    const existingIdx = logs.findIndex(l => l.id === entryId);
    if (existingIdx >= 0) {
      logs[existingIdx] = fullEntry;
    } else {
      logs.unshift(fullEntry);
    }
    await AsyncStorage.setItem(cacheKey, JSON.stringify(logs));
    return true;
  } catch (e) {
    console.error('saveHealthEntry error:', e);
    return false;
  }
};

/**
 * Get health logs
 */
export const getHealthLogs = async (userId, days = 30) => {
  if (!userId) return [];
  const cacheKey = getCacheKey(userId);

  try {
    // Try to get from Firestore
    const colRef = collection(db, 'users', userId, 'healthLogs');
    const querySnapshot = await getDocs(colRef);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data());
    });

    // Sort descending by date
    logs.sort((a, b) => b.date - a.date);

    // Save to local cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.warn('Firestore health logs fetch failed, using cache:', err.message);
    try {
      const cachedString = await AsyncStorage.getItem(cacheKey);
      if (cachedString) {
        const logs = JSON.parse(cachedString);
        logs.sort((a, b) => b.date - a.date);
        return logs;
      }
    } catch (e) {
      console.error('Cache read error for health logs:', e);
    }
  }
  return [];
};

/**
 * Get latest health entry
 */
export const getLatestHealthEntry = async (userId) => {
  const logs = await getHealthLogs(userId, 7);
  return logs.length > 0 ? logs[0] : null;
};
