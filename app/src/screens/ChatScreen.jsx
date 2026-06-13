import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Platform,
  ActivityIndicator, Linking, Keyboard, Alert, Animated, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Send, AlertTriangle, Phone, MapPin, Square, Plus } from 'lucide-react-native';
import ChatBubble from '../components/ChatBubble';
import { sendMessageToAI, getOpeningMessage } from '../services/aiService';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { saveSession, getSessionById } from '../services/sessionService';

// Lazy-load expo-av — it may not be available in Expo Go
let Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  // Silent fallback when native modules are not loaded
}

export default function ChatScreen({ route, navigation }) {
  const { t, isHindi, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [currentSessionId, setCurrentSessionId] = useState(route.params?.sessionId || null);
  const [messages, setMessages] = useState([
    { id: '1', text: getOpeningMessage(), isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [doctorType, setDoctorType] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Load history or reset state when route parameters change
  useEffect(() => {
    const loadSession = async () => {
      const paramSessionId = route.params?.sessionId || null;
      if (paramSessionId && user) {
        setLoading(true);
        const session = await getSessionById(user.uid, paramSessionId);
        if (session && session.messages) {
          setMessages(session.messages);
          setDoctorType(session.doctorType || null);
          setIsEmergency(session.urgency === 'high');
          setCurrentSessionId(paramSessionId);
        }
        setLoading(false);
      } else {
        // Clear to starting screen if starting fresh
        setMessages([
          { id: '1', text: getOpeningMessage(), isUser: false },
        ]);
        setDoctorType(null);
        setIsEmergency(false);
        setQuickReplies([]);
        setCurrentSessionId(null);
      }
    };

    loadSession();
  }, [route.params, user]);

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(!!Audio);
  const recordingRef = useRef(null);
  const scrollViewRef = useRef();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Keyboard tracking
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading, quickReplies]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // ─── VOICE RECORDING ──────────────────────────────
  const startRecording = async () => {
    if (!Audio) {
      Alert.alert(
        isHindi ? 'उपलब्ध नहीं' : 'Not Available',
        isHindi ? 'Voice feature के लिए Development Build चाहिए। अभी type करके बताएं।' : 'Voice feature requires a Development Build. Please type your message instead.'
      );
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', isHindi ? 'माइक्रोफ़ोन की अनुमति चाहिए।' : 'Microphone permission needed.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Recording Error:', err);
      Alert.alert('Error', isHindi ? 'रिकॉर्डिंग शुरू नहीं हो सकी।' : 'Recording could not start.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) throw new Error('No recording URI');

      // Try to transcribe
      let transcribeAudio;
      try {
        transcribeAudio = require('../services/voiceService').transcribeAudio;
      } catch (e) {
        throw new Error('Voice service not available');
      }

      const transcribedText = await transcribeAudio(uri);
      if (transcribedText) {
        setInput(transcribedText);
      } else {
        Alert.alert('Oops', isHindi ? 'आवाज़ समझ नहीं आई। दोबारा बोलें।' : 'Voice samajh nahi aayi. Dobara bolein.');
      }
    } catch (err) {
      console.error('Transcription Error:', err);
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Voice Error',
        isHindi ? 'आवाज़ पहचान नहीं हो सकी। Type करके बताएं।' : 'Voice transcribe nahi ho paayi. Type karein.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleNewChat = () => {
    // Reset route params to prevent reloading old session on tab switch/focus
    navigation.setParams({ sessionId: null, key: null });
    // Reset state to fresh chat
    setCurrentSessionId(null);
    setMessages([
      { id: '1', text: getOpeningMessage(), isUser: false },
    ]);
    setDoctorType(null);
    setIsEmergency(false);
    setQuickReplies([]);
    setInput('');
  };

  // ─── SEND MESSAGE ─────────────────────────────────
  const handleSend = async (textOverride) => {
    const userText = (textOverride || input).trim();
    if (!userText || loading) return;

    Keyboard.dismiss();

    const sessionId = currentSessionId || Date.now().toString();
    const newUserMsg = { id: Date.now().toString(), text: userText, isUser: true, createdAt: Date.now() };
    
    // Save to local UI state
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setQuickReplies([]);
    setDoctorType(null);
    setLoading(true);

    if (user) {
      // Save user message in background
      saveSession(user.uid, sessionId, updatedMessages);
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }
    }

    try {
      // Send chat history (excluding system prompt because sendMessageToAI adds it)
      const response = await sendMessageToAI(userText, messages);

      if (response.isEmergency) {
        setIsEmergency(true);
        if (user) {
          saveSession(user.uid, sessionId, updatedMessages, { urgency: 'high' });
        }
        return;
      }

      const newAIMsg = { id: Date.now().toString(), text: response.text, isUser: false, createdAt: Date.now() };
      const finalMessages = [...updatedMessages, newAIMsg];
      setMessages(finalMessages);

      if (response.quickReplies?.length) {
        setQuickReplies(response.quickReplies);
      }

      if (response.doctorType) {
        setDoctorType(response.doctorType);
      }

      if (user) {
        saveSession(user.uid, sessionId, finalMessages, {
          urgency: response.isEmergency ? 'high' : 'low',
          doctorType: response.doctorType,
        });
      }

    } catch (err) {
      const errorMsgText = t('errorMsg');
      const errorMsg = { id: Date.now().toString(), text: errorMsgText, isUser: false, createdAt: Date.now() };
      const finalMessagesWithError = [...updatedMessages, errorMsg];
      setMessages(finalMessagesWithError);
      
      if (user) {
        saveSession(user.uid, sessionId, finalMessagesWithError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFindDoctor = () => {
    const query = encodeURIComponent(`${doctorType || 'doctor'} near me`);
    const url = `https://www.google.com/maps/search/${query}`;
    Linking.openURL(url);
  };

  const handleCall108 = () => Linking.openURL('tel:108');

  // ─── EMERGENCY SCREEN ───────────────────────────────────
  if (isEmergency) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#A32D2D', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <AlertTriangle size={80} color="white" />
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: 'white', marginTop: 24, marginBottom: 12, textAlign: 'center' }}>
          {t('emergency')}
        </Text>
        <Text style={{ fontSize: 16, color: 'white', textAlign: 'center', marginBottom: 40, lineHeight: 24, opacity: 0.9 }}>
          {t('emergencyDesc')}
        </Text>
        <TouchableOpacity
          onPress={handleCall108}
          style={{ backgroundColor: 'white', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 }}
        >
          <Phone size={24} color="#A32D2D" />
          <Text style={{ color: '#A32D2D', fontWeight: 'bold', fontSize: 22 }}>{t('call108')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsEmergency(false)} style={{ padding: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('notMyEmergency')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── MAIN CHAT SCREEN ───────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={{
          padding: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{t('triageChat')}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* New Chat Button */}
            <TouchableOpacity
              onPress={handleNewChat}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.input,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Plus size={14} color={colors.accent} strokeWidth={3} />
              <Text style={{ fontWeight: '700', fontSize: 12, color: colors.accent }}>
                {t('newChat')}
              </Text>
            </TouchableOpacity>

            {/* Hindi/English Toggle */}
            <TouchableOpacity
              onPress={toggleLanguage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isHindi ? colors.accentBg : (isDark ? '#0A1E2D' : '#F0F9FF'),
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isHindi ? colors.accentLight : (isDark ? '#13354C' : '#E0F2FE'),
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 12, color: isHindi ? colors.accent : (isDark ? '#38BDF8' : '#0284C7') }}>
                {isHindi ? 'EN' : 'हिं'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Recording Banner */}
      {isRecording && (
        <View style={{
          backgroundColor: '#DC2626', paddingVertical: 10, paddingHorizontal: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <Animated.View style={{
            width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff',
            transform: [{ scale: pulseAnim }]
          }} />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('recording')}</Text>
        </View>
      )}

      {/* Transcribing Banner */}
      {isTranscribing && (
        <View style={{
          backgroundColor: '#534AB7', paddingVertical: 10, paddingHorizontal: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('convertingVoiceText')}</Text>
        </View>
      )}

      {/* Messages list */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, paddingTop: 12 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
        ))}

        {loading && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16, paddingHorizontal: 16 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: colors.border }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          </View>
        )}

        {!loading && quickReplies.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 11, color: colors.subtext, marginBottom: 8, marginLeft: 2 }}>
              {t('quickReplyHint')}
            </Text>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSend(reply)}
                style={{
                  backgroundColor: colors.card, borderWidth: 1, borderColor: colors.accent,
                  borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16,
                  marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
                }}
              >
                <Text style={{ fontSize: 13, color: colors.accent, flex: 1, lineHeight: 18 }}>{reply}</Text>
                <Text style={{ fontSize: 16, color: colors.accent }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && doctorType && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TouchableOpacity
              onPress={handleFindDoctor}
              style={{
                backgroundColor: '#1D9E75', borderRadius: 16, paddingVertical: 14,
                paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', gap: 10,
              }}
            >
              <MapPin size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
                {t('findNearby')} {doctorType}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{t('maps')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 8, gap: 8,
        backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.border,
      }}>
        {/* Mic Button */}
        <TouchableOpacity
          onPress={toggleRecording}
          disabled={loading || isTranscribing}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: isRecording ? '#DC2626' : (isTranscribing ? colors.border : colors.input),
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isRecording ? (
            <Square size={18} color="#fff" fill="#fff" />
          ) : (
            <Mic size={20} color={isTranscribing ? '#999' : colors.accent} />
          )}
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={{
            flex: 1, backgroundColor: colors.input, color: colors.inputText || colors.text,
            paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
            borderRadius: 24, fontSize: 14, minHeight: 44, maxHeight: 100,
          }}
          placeholder={isTranscribing ? t('convertingVoice') : t('typeSymptoms')}
          placeholderTextColor={colors.subtext}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!isTranscribing}
        />

        {/* Send Button */}
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={loading || !input.trim() || isTranscribing}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: input.trim() && !loading && !isTranscribing ? colors.accent : colors.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}