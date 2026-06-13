import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useLanguage } from '../hooks/useLanguage';

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const { t } = useLanguage();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-bgLight dark:bg-bgDark p-6">
        <Text className="text-center font-dmSans text-textLight dark:text-textDark mb-4 text-lg">
          {t('cameraPermission')}
        </Text>
        <TouchableOpacity 
          className="bg-warning px-6 py-3 rounded-xl"
          onPress={requestPermission}
        >
          <Text className="text-white font-poppins font-semibold">{t('grantPermission')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      navigation.navigate('ScanPreview', { photoUri: photo.uri });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1, width: '100%', height: '100%' }} facing="back" ref={cameraRef} />
      
      <SafeAreaView className="flex-1 justify-between p-6 pointer-events-box-none absolute w-full h-full z-10">
        <View className="flex-row justify-end">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-black/50 rounded-full">
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>
        
        <View className="items-center mb-10">
          <Text className="text-white font-poppins font-semibold mb-4 bg-black/50 px-4 py-2 rounded-lg">
            {t('positionSymptom')}
          </Text>
          <TouchableOpacity onPress={takePicture} className="w-20 h-20 rounded-full border-4 border-white items-center justify-center">
            <View className="w-16 h-16 bg-white rounded-full" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
