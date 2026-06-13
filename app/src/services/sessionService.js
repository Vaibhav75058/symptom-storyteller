import { db } from './firebaseConfig';
import { 
  collection, doc, setDoc, getDocs, getDoc, 
  query, where, orderBy, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_SESSIONS_CACHE_KEY = '@symptom_storyteller_sessions_';

/**
 * Generate a clean title from the user's first message
 */
const generateSessionTitle = (text, isHindi) => {
  const words = text.split(/\s+/).slice(0, 5).join(' ');
  return words + (text.split(/\s+/).length > 5 ? '...' : '');
};

/**
 * Get the cache key for a specific user
 */
const getCacheKey = (userId) => `${LOCAL_SESSIONS_CACHE_KEY}${userId}`;

/**
 * Save or update a session in Firestore and local cache
 */
export const saveSession = async (userId, sessionId, messages, additionalData = {}) => {
  if (!userId || !sessionId) return null;

  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    
    // Determine title if not provided
    let title = additionalData.title;
    if (!title && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.isUser);
      if (firstUserMsg) {
        title = generateSessionTitle(firstUserMsg.text);
      }
    }

    const lastMessage = messages[messages.length - 1]?.text || '';

    const sessionDoc = {
      id: sessionId,
      userId,
      title: title || 'New Chat Triage',
      messages,
      lastMessage,
      urgency: additionalData.urgency || 'low',
      doctorType: additionalData.doctorType || null,
      lastActive: new Date().getTime(),
      createdAt: additionalData.createdAt || new Date().getTime(),
    };

    // Save to Firestore (asynchronous background)
    setDoc(sessionRef, sessionDoc, { merge: true }).catch(err => {
      console.warn('Firestore Session Write Error (Safe Fallback Used):', err.message);
    });

    // Save to Local Cache (instant)
    await cacheSessionLocally(userId, sessionDoc);
    return sessionDoc;
  } catch (error) {
    console.error('Save Session Main Error:', error.message);
    return null;
  }
};

/**
 * Helper to update local AsyncStorage cache
 */
const cacheSessionLocally = async (userId, sessionDoc) => {
  try {
    const cacheKey = getCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    let sessions = cachedString ? JSON.parse(cachedString) : [];
    
    // Remove if already exists, then insert at top
    sessions = sessions.filter(s => s.id !== sessionDoc.id);
    sessions.unshift(sessionDoc);
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Local Caching Error:', e.message);
  }
};

/**
 * Get all sessions for a specific user, syncing Firestore to cache
 */
export const getUserSessions = async (userId) => {
  if (!userId) return [];

  const cacheKey = getCacheKey(userId);

  try {
    // 1. Try to fetch from Firestore first
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef, 
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((docSnapshot) => {
      sessions.push(docSnapshot.data());
    });

    // Sort in memory to avoid needing a Firestore composite index
    sessions.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

    // Update local cache with latest sorted sessions
    await AsyncStorage.setItem(cacheKey, JSON.stringify(sessions));
    return sessions;
  } catch (firestoreError) {
    console.warn('Firestore fetch failed, falling back to local cache:', firestoreError.message);
  }

  // 2. Fallback to AsyncStorage cache
  try {
    const cachedString = await AsyncStorage.getItem(cacheKey);
    return cachedString ? JSON.parse(cachedString) : [];
  } catch (cacheError) {
    console.error('Local cache fetch failed:', cacheError.message);
    return [];
  }
};

/**
 * Get a single session details by ID
 */
export const getSessionById = async (userId, sessionId) => {
  if (!userId || !sessionId) return null;

  // 1. Check local cache first for instant load
  try {
    const cacheKey = getCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    if (cachedString) {
      const sessions = JSON.parse(cachedString);
      const found = sessions.find(s => s.id === sessionId);
      if (found) return found;
    }
  } catch (e) {}

  // 2. Fallback to Firestore
  try {
    const docRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.warn('Fetch Session ID from Firestore Failed:', error.message);
  }
  return null;
};

/**
 * Delete a session
 */
export const deleteSession = async (userId, sessionId) => {
  if (!userId || !sessionId) return false;

  try {
    // Delete from Firestore
    const docRef = doc(db, 'sessions', sessionId);
    deleteDoc(docRef).catch(() => {});

    // Delete from local cache
    const cacheKey = getCacheKey(userId);
    const cachedString = await AsyncStorage.getItem(cacheKey);
    if (cachedString) {
      let sessions = JSON.parse(cachedString);
      sessions = sessions.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(sessions));
    }
    return true;
  } catch (e) {
    console.error('Delete Session Error:', e.message);
    return false;
  }
};
