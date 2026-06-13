import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbhCdsE9F00PJ3XCqi5RZ1_QCdsUd-zkg",
  authDomain: "symptom-storyteller.firebaseapp.com",
  projectId: "symptom-storyteller",
  storageBucket: "symptom-storyteller.firebasestorage.app",
  messagingSenderId: "501532215958",
  appId: "1:501532215958:android:86b49df57acc27823d10b7"
};

// Initialize Firebase safely for Expo Fast Refresh
let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
