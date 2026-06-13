import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const getFriendlyErrorMessage = (error) => {
    const code = error.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account already exists with this email address.';
    }
    if (code === 'auth/invalid-email') {
      return 'The email address is not valid.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters.';
    }
    return error.message.replace('Firebase: ', '').split(' (auth/')[0];
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const register = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      setUser({ ...userCredential.user, displayName: name });
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const googleLogin = async () => {
    alert("Google Sign-In is temporarily disabled in Expo Go. Please use Email/Password.");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleLogin, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
