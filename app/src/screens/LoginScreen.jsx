import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert('Please enter email and password');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      alert('Login Failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
    } catch (error) {
      alert('Google Sign-In Failed: ' + error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surfaceLight dark:bg-bgDark">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40, paddingTop: 40 }}>
        <View className="items-center mb-10">
          <Text className="text-4xl font-poppins font-bold text-warning dark:text-warning mb-2 text-center">
            Symptom Storyteller
          </Text>
          <Text className="text-base font-dmSans text-textLight/70 dark:text-textDark/70 text-center">
            Your friendly health companion.
          </Text>
        </View>

        <View className="mb-6" style={{ gap: 16 }}>
          <View>
            <Text className="text-sm font-dmSans text-textLight dark:text-textDark mb-1 ml-1">Email</Text>
            <TextInput
              className="w-full bg-white dark:bg-surfaceDark text-textLight dark:text-textDark px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-dmSans"
              placeholder="Enter your email"
              placeholderTextColor="#A09F9B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-sm font-dmSans text-textLight dark:text-textDark mb-1 ml-1">Password</Text>
            <TextInput
              className="w-full bg-white dark:bg-surfaceDark text-textLight dark:text-textDark px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-dmSans"
              placeholder="Enter your password"
              placeholderTextColor="#A09F9B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} className="self-end mt-1">
            <Text className="text-sm font-dmSans text-primary dark:text-primary">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className={`w-full ${isLoading ? 'bg-warning/70' : 'bg-warning'} py-4 rounded-xl shadow-sm mb-4`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text className="text-white text-center font-poppins font-semibold text-lg">{isLoading ? 'Logging In...' : 'Log In'}</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-textLight dark:text-textDark font-dmSans">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-warning font-poppins font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
