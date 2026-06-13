import { db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_PROFILE_CACHE_KEY = '@symptom_storyteller_profile_';

const getCacheKey = (userId) => `${LOCAL_PROFILE_CACHE_KEY}${userId}`;

export const defaultProfile = {
  age: '',
  gender: '',
  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
};

/**
 * Save user profile to Firestore and cache locally
 */
export const saveUserProfile = async (userId, profileData) => {
  if (!userId) return false;

  try {
    const docRef = doc(db, 'profiles', userId);
    
    const profileDoc = {
      ...profileData,
      updatedAt: new Date().getTime(),
    };

    // Save to Firestore (asynchronous background task with silent error catch)
    setDoc(docRef, profileDoc, { merge: true }).catch((err) => {
      console.warn('Firestore Profile Write Failed (Fallback used):', err.message);
    });

    // Save to local cache instantly
    const cacheKey = getCacheKey(userId);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(profileDoc));
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error.message);
    return false;
  }
};

/**
 * Get user profile from Firestore, fallback to local cache
 */
export const getUserProfile = async (userId) => {
  if (!userId) return defaultProfile;

  const cacheKey = getCacheKey(userId);

  try {
    // 1. Try to fetch from Firestore first
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Update cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return { ...defaultProfile, ...data };
    }
  } catch (firestoreError) {
    console.warn('Firestore profile fetch failed, falling back to local cache:', firestoreError.message);
  }

  // 2. Fallback to AsyncStorage cache
  try {
    const cachedString = await AsyncStorage.getItem(cacheKey);
    if (cachedString) {
      return { ...defaultProfile, ...JSON.parse(cachedString) };
    }
  } catch (cacheError) {
    console.error('Local profile cache fetch failed:', cacheError.message);
  }

  return defaultProfile;
};
