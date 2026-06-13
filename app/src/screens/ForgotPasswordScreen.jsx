import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    console.log("Resetting password for:", email);
  };

  return (
    <SafeAreaView className="flex-1 bg-surfaceLight dark:bg-bgDark">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-4 left-6 p-2 z-10">
          <Text className="text-textLight dark:text-textDark font-dmSans">← Back</Text>
        </TouchableOpacity>

        <View className="items-center mb-10">
          <Text className="text-3xl font-poppins font-bold text-warning dark:text-warning mb-2 text-center">
            Reset Password
          </Text>
          <Text className="text-base font-dmSans text-textLight/70 dark:text-textDark/70 text-center">
            We'll send you an email with a link to reset it.
          </Text>
        </View>

        <View className="mb-6">
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

        <TouchableOpacity 
          className="w-full bg-warning py-4 rounded-xl shadow-sm mb-4"
          onPress={handleReset}
        >
          <Text className="text-white text-center font-poppins font-semibold text-lg">Send Reset Link</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
