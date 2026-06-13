import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return alert('Please fill all fields');
    setIsLoading(true);
    try {
      await register(email, password, name);
    } catch (error) {
      alert('Registration Failed: ' + error.message);
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-4 left-0 p-2 z-10">
            <Text className="text-textLight dark:text-textDark font-dmSans">← Back</Text>
          </TouchableOpacity>

          <View className="items-center mb-8 mt-12">
            <Text className="text-3xl font-poppins font-bold text-warning dark:text-warning mb-2 text-center">
              Create Account
            </Text>
            <Text className="text-base font-dmSans text-textLight/70 dark:text-textDark/70 text-center">
              Join Symptom Storyteller today.
            </Text>
          </View>

          <View className="mb-8" style={{ gap: 16 }}>
            <View>
              <Text className="text-sm font-dmSans text-textLight dark:text-textDark mb-1 ml-1">Full Name</Text>
              <TextInput
                className="w-full bg-white dark:bg-surfaceDark text-textLight dark:text-textDark px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-dmSans"
                placeholder="Enter your name"
                placeholderTextColor="#A09F9B"
                value={name}
                onChangeText={setName}
              />
            </View>

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
                placeholder="Create a password"
                placeholderTextColor="#A09F9B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            className={`w-full ${isLoading ? 'bg-warning/70' : 'bg-warning'} py-4 rounded-xl shadow-sm mb-4`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-poppins font-semibold text-lg">{isLoading ? 'Signing Up...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-2">
            <Text className="text-textLight dark:text-textDark font-dmSans">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-warning font-poppins font-semibold">Log In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
