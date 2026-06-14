import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Heart, SunMoon } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { getUserProfile, saveUserProfile, defaultProfile } from '../services/profileService';

const InputRow = ({ label, value, onChange, placeholder, keyboardType, colors }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.subtext, marginBottom: 6, marginLeft: 2 }}>
      {label}
    </Text>
    <TextInput
      style={{
        width: '100%',
        backgroundColor: colors.input,
        color: colors.inputText || colors.text,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.subtext}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, isHindi } = useLanguage();
  const { isDark, colors, toggleTheme } = useTheme();
  
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getUserProfile(user.uid)
        .then((data) => {
          setProfile(data);
        })
        .catch((err) => console.log('Error fetching profile:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const success = await saveUserProfile(user.uid, profile);
    setSaving(false);
    if (success) {
      Alert.alert(isHindi ? 'सफल' : 'Success', t('profileSaved'));
    } else {
      Alert.alert(isHindi ? 'त्रुटि' : 'Error', t('profileSaveError'));
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          {/* Header Card */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.card,
            padding: 20,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
            shadowColor: colors.shadow,
            shadowOpacity: 0.02,
            shadowRadius: 10,
            elevation: 1,
            alignItems: 'center'
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.accentLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <User size={30} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.subtext, marginTop: 2 }}>
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Medical Profile Section */}
          <View style={{
            backgroundColor: colors.card,
            padding: 20,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
            shadowColor: colors.shadow,
            shadowOpacity: 0.02,
            shadowRadius: 10,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Heart size={20} color={colors.accent} fill={colors.accent} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                {t('medicalProfile')}
              </Text>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ marginTop: 12, color: colors.subtext, fontSize: 14 }}>
                  {t('profileLoading')}
                </Text>
              </View>
            ) : (
              <View>
                <InputRow 
                  label={t('age')} 
                  value={profile.age} 
                  onChange={v => setProfile({...profile, age: v})} 
                  placeholder="e.g. 28" 
                  keyboardType="numeric"
                  colors={colors}
                />
                <InputRow 
                  label={t('gender')} 
                  value={profile.gender} 
                  onChange={v => setProfile({...profile, gender: v})} 
                  placeholder="e.g. Male, Female"
                  colors={colors}
                />
                <InputRow 
                  label={t('bloodGroup')} 
                  value={profile.bloodGroup} 
                  onChange={v => setProfile({...profile, bloodGroup: v})} 
                  placeholder="e.g. O+, A-, B+"
                  colors={colors}
                />
                <InputRow 
                  label={t('allergies')} 
                  value={profile.allergies} 
                  onChange={v => setProfile({...profile, allergies: v})} 
                  placeholder="e.g. Peanuts, Penicillin (or None)"
                  colors={colors}
                />
                <InputRow 
                  label={t('chronicConditions')} 
                  value={profile.chronicConditions} 
                  onChange={v => setProfile({...profile, chronicConditions: v})} 
                  placeholder="e.g. Asthma, Hypertension (or None)"
                  colors={colors}
                />

                <TouchableOpacity 
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: colors.accent,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 8,
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      {t('saveChanges')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Appearance Section */}
          <View style={{
            backgroundColor: colors.card,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
            shadowColor: colors.shadow,
            shadowOpacity: 0.02,
            shadowRadius: 10,
            elevation: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SunMoon size={20} color={colors.accent} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                  {t('darkMode')}
                </Text>
                <Text style={{ fontSize: 11, color: colors.subtext, marginTop: 1 }}>
                  {t('appearance')}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.accent }}
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              backgroundColor: colors.dangerBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <LogOut size={18} color={colors.danger} />
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.danger }}>
              {t('logout')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
