import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeSymptomPhoto } from '../services/symptomService';
import { useLanguage } from '../hooks/useLanguage';

export default function ScanPreviewScreen({ route, navigation }) {
  const { photoUri } = route.params;
  const [analyzing, setAnalyzing] = useState(false);
  const { t, isHindi } = useLanguage();

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Convert photo to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to AI for analysis
      const result = await analyzeSymptomPhoto(base64, isHindi);

      setAnalyzing(false);
      navigation.navigate('TriageResult', { result });
    } catch (error) {
      setAnalyzing(false);
      Alert.alert(
        isHindi ? 'विश्लेषण विफल रहा' : 'Analysis Failed',
        error.message || (isHindi ? 'चित्र का विश्लेषण नहीं किया जा सका। कृपया पुनः प्रयास करें।' : 'Could not analyze the image. Please try again.'),
        [
          { text: t('retake'), onPress: () => navigation.goBack() },
          { text: isHindi ? 'पुनः प्रयास करें' : 'Try Again', onPress: handleAnalyze },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1A18', marginBottom: 16 }}>
          {t('preview')}
        </Text>
        
        <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', marginBottom: 20, backgroundColor: '#E5E4E0' }}>
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        {analyzing ? (
          <View style={{
            backgroundColor: '#fff', padding: 24, borderRadius: 20, alignItems: 'center',
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
          }}>
            <ActivityIndicator size="large" color="#BA7517" style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#1A1A18', marginBottom: 4 }}>
              {t('analyzingSymptom')}
            </Text>
            <Text style={{ fontSize: 13, color: '#888780', textAlign: 'center' }}>
              {t('analyzingSymptomDesc')}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{
                flex: 1, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14,
                alignItems: 'center', borderWidth: 1, borderColor: '#E5E4E0'
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 16, color: '#1A1A18' }}>{t('retake')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleAnalyze}
              style={{
                flex: 1, backgroundColor: '#BA7517', paddingVertical: 16, borderRadius: 14,
                alignItems: 'center'
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 16, color: '#fff' }}>{t('analyze')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
