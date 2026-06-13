import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  TextInput, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Camera, Search, X, ArrowLeft, Pill, AlertTriangle,
  Repeat, ShieldAlert, Zap, Package, FlaskConical, Ban, Brain
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeMedicineFromPhoto, searchMedicineByName } from '../services/medicineService';
import { useLanguage } from '../hooks/useLanguage';

export default function MedicineScannerScreen({ navigation }) {
  const { t, isHindi, toggleLanguage } = useLanguage();
  const [mode, setMode] = useState('home');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // ─── CAMERA ───────────────────────────────────────
  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', isHindi ? 'कैमरा अनुमति चाहिए' : 'Camera permission needed.');
        return;
      }
    }
    setMode('camera');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        setPhotoUri(photo.uri);
        setMode('preview');
      } catch (err) {
        Alert.alert('Error', isHindi ? 'फ़ोटो नहीं ली जा सकी।' : 'Could not take photo.');
      }
    }
  };

  const analyzePhoto = async () => {
    setMode('searching');
    setAnalyzing(true);
    setError(null);
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const data = await analyzeMedicineFromPhoto(base64, isHindi);
      setResult(data);
      setMode('result');
    } catch (err) {
      setError(err.message);
      setMode('home');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── TEXT SEARCH ──────────────────────────────────
  const handleTextSearch = async () => {
    const name = searchText.trim();
    if (!name) return;
    setMode('searching');
    setAnalyzing(true);
    setError(null);
    try {
      const data = await searchMedicineByName(name, isHindi);
      setResult(data);
      setMode('result');
    } catch (err) {
      setError(err.message);
      setMode('home');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetToHome = () => {
    setMode('home');
    setResult(null);
    setPhotoUri(null);
    setSearchText('');
    setError(null);
  };

  // ─── CAMERA MODE ──────────────────────────────────
  if (mode === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef} />
        <SafeAreaView style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'space-between', padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setMode('home')} style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              <X color="white" size={24} />
            </TouchableOpacity>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>{t('medicineScannerTitle')}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 280, height: 160, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderStyle: 'dashed', marginBottom: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Pill size={32} color="rgba(255,255,255,0.4)" />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 }}>{t('medicineFrame')}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <TouchableOpacity onPress={takePicture} style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 62, height: 62, backgroundColor: 'white', borderRadius: 31 }} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── PREVIEW MODE ─────────────────────────────────
  if (mode === 'preview') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1A18', marginBottom: 16 }}>{t('preview')}</Text>
          <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setMode('camera')} style={{ flex: 1, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E4E0' }}>
              <Text style={{ fontWeight: '600', fontSize: 16, color: '#1A1A18' }}>{t('retake')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={analyzePhoto} style={{ flex: 1, backgroundColor: '#BA7517', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ fontWeight: '600', fontSize: 16, color: '#fff' }}>{t('analyze')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── SEARCHING MODE ───────────────────────────────
  if (mode === 'searching') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', padding: 40, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 5, marginHorizontal: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Pill size={28} color="#BA7517" />
          </View>
          <ActivityIndicator size="large" color="#BA7517" style={{ marginBottom: 16 }} />
          <Text style={{ fontWeight: '700', fontSize: 17, color: '#1A1A18', marginBottom: 8, textAlign: 'center' }}>{t('analyzingMedicine')}</Text>
          <Text style={{ fontSize: 13, color: '#888780', textAlign: 'center', lineHeight: 20 }}>{t('analyzingMedicineDesc')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── RESULT MODE — DETAILED ───────────────────────
  if (mode === 'result' && result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={resetToHome} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArrowLeft size={20} color="#BA7517" />
              <Text style={{ color: '#BA7517', fontWeight: '600', fontSize: 15, marginLeft: 6 }}>{t('back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleLanguage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isHindi ? '#FFF3E8' : '#F0F9FF',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isHindi ? '#FFE6CD' : '#E0F2FE',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 12, color: isHindi ? '#BA7517' : '#0284C7' }}>
                {isHindi ? 'EN' : 'हिं'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Medicine Name Card */}
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F0EFE8' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Pill size={24} color="#BA7517" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1A18' }}>{result.medicine_name || 'Unknown'}</Text>
                <Text style={{ fontSize: 13, color: '#888780', marginTop: 2 }}>
                  {result.generic_name || ''}{result.drug_class ? ` • ${result.drug_class}` : ''}
                </Text>
              </View>
            </View>
            {result.manufacturer && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F6F3', padding: 10, borderRadius: 10 }}>
                <Package size={14} color="#888780" />
                <Text style={{ fontSize: 12, color: '#888780', marginLeft: 6 }}>{result.manufacturer}</Text>
              </View>
            )}
          </View>

          {/* How It Works */}
          {result.how_it_works && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Brain size={18} color="#534AB7" />
                <Text style={cardTitleStyle}>{isHindi ? 'कैसे काम करती है' : 'How It Works'}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#49454F', lineHeight: 22 }}>{result.how_it_works}</Text>
            </View>
          )}

          {/* Uses — Detailed */}
          {result.uses?.length > 0 && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Zap size={18} color="#16A34A" />
                <Text style={cardTitleStyle}>{t('uses')}</Text>
              </View>
              {result.uses.map((use, i) => (
                <View key={i} style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#16A34A' }}>
                  <Text style={{ fontSize: 14, color: '#1A1A18', lineHeight: 21 }}>{use}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Side Effects — Detailed */}
          {result.side_effects?.length > 0 && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <AlertTriangle size={18} color="#EAB308" />
                <Text style={cardTitleStyle}>{t('sideEffects')}</Text>
              </View>
              {result.side_effects.map((se, i) => (
                <View key={i} style={{ backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#EAB308' }}>
                  <Text style={{ fontSize: 14, color: '#1A1A18', lineHeight: 21 }}>{se}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dosage Info */}
          {result.dosage_info && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <FlaskConical size={18} color="#534AB7" />
                <Text style={cardTitleStyle}>{t('dosageInfo')}</Text>
              </View>
              <View style={{ backgroundColor: '#F5F3FF', padding: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#534AB7' }}>
                <Text style={{ fontSize: 14, color: '#49454F', lineHeight: 22 }}>{result.dosage_info}</Text>
              </View>
            </View>
          )}

          {/* Contraindications — Detailed */}
          {result.contraindications?.length > 0 && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ban size={18} color="#DC2626" />
                <Text style={cardTitleStyle}>{t('contraindications')}</Text>
              </View>
              {result.contraindications.map((c, i) => (
                <View key={i} style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#DC2626' }}>
                  <Text style={{ fontSize: 14, color: '#1A1A18', lineHeight: 21 }}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Drug Interactions — Detailed */}
          {result.interactions?.length > 0 && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Repeat size={18} color="#0284C7" />
                <Text style={cardTitleStyle}>{t('drugInteractions')}</Text>
              </View>
              {result.interactions.map((item, i) => (
                <View key={i} style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#0284C7' }}>
                  <Text style={{ fontSize: 14, color: '#1A1A18', lineHeight: 21 }}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Storage */}
          {result.storage && (
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Package size={18} color="#888780" />
                <Text style={cardTitleStyle}>{t('storage')}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#49454F', lineHeight: 22 }}>{result.storage}</Text>
            </View>
          )}

          {/* Disclaimer */}
          <View style={{ backgroundColor: '#FEF3C7', padding: 16, borderRadius: 14, marginBottom: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#FDE68A' }}>
            <ShieldAlert size={18} color="#92400E" style={{ marginTop: 2, marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 }}>
              {result.important_note || (isHindi ? 'यह जानकारी केवल शिक्षा के लिए है। हमेशा अपने डॉक्टर की सलाह का पालन करें।' : 'This information is for educational purposes only. Always follow your doctor\'s prescription.')}
            </Text>
          </View>

        </ScrollView>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0EFE8' }}>
          <TouchableOpacity onPress={resetToHome} style={{ backgroundColor: '#BA7517', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('searchAnother')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── HOME MODE ────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1A1A18' }}>{t('medicineInfoTitle')}</Text>
            <TouchableOpacity
              onPress={toggleLanguage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isHindi ? '#FFF3E8' : '#F0F9FF',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isHindi ? '#FFE6CD' : '#E0F2FE',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 12, color: isHindi ? '#BA7517' : '#0284C7' }}>
                {isHindi ? 'EN' : 'हिं'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 15, color: '#888780', marginBottom: 28, lineHeight: 22 }}>{t('medicineInfoSubtitle')}</Text>

          {error && (
            <View style={{ backgroundColor: '#FEE2E2', padding: 14, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' }}>
              <AlertTriangle size={18} color="#DC2626" />
              <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: '#991B1B' }}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}><X size={16} color="#991B1B" /></TouchableOpacity>
            </View>
          )}

          {/* Scan Card */}
          <TouchableOpacity onPress={openCamera} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E4E0', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Camera size={28} color="#BA7517" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A18', marginBottom: 4 }}>{t('scanMedicine')}</Text>
            <Text style={{ fontSize: 13, color: '#888780', textAlign: 'center' }}>{t('scanMedicineDesc')}</Text>
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E4E0' }} />
            <Text style={{ marginHorizontal: 16, color: '#888780', fontWeight: '600', fontSize: 13 }}>{t('or')}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E4E0' }} />
          </View>

          {/* Search Card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F0EFE8' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A18', marginBottom: 12 }}>{t('searchByName')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F6F3', borderRadius: 14, paddingHorizontal: 14 }}>
              <Search size={18} color="#888780" />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, color: '#1A1A18' }}
                placeholder={t('searchPlaceholder')}
                placeholderTextColor="#B5B3AC"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleTextSearch}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}><X size={18} color="#888780" /></TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={handleTextSearch}
              disabled={!searchText.trim()}
              style={{ backgroundColor: searchText.trim() ? '#BA7517' : '#D3D1C7', paddingVertical: 14, borderRadius: 12, marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('searchMedicineBtn')}</Text>
            </TouchableOpacity>
          </View>

          {/* Popular chips */}
          <Text style={{ fontSize: 13, color: '#888780', marginBottom: 10, marginTop: 4 }}>{t('popularSearches')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Paracetamol', 'Dolo 650', 'Azithromycin', 'Amoxicillin', 'Cetirizine', 'Pantoprazole'].map((med, i) => (
              <TouchableOpacity key={i} onPress={() => setSearchText(med)} style={{ backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E4E0' }}>
                <Text style={{ fontSize: 13, color: '#49454F' }}>{med}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cardStyle = {
  backgroundColor: '#fff', padding: 20, borderRadius: 18, marginBottom: 14,
  borderWidth: 1, borderColor: '#F0EFE8',
};
const cardTitleStyle = {
  fontSize: 16, fontWeight: '700', color: '#1A1A18', marginLeft: 8,
};
