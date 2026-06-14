import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Droplets, Scale, Plus, X, TrendingUp, ArrowLeft, Activity } from 'lucide-react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { saveHealthEntry, getHealthLogs, getLatestHealthEntry } from '../services/healthService';
import { useAuth } from '../hooks/useAuth';
import { useIsFocused } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

export default function HealthDashboardScreen({ navigation }) {
  const { t, isHindi } = useLanguage();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('weekly'); // weekly | monthly

  // Form state
  const [heartRate, setHeartRate] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [weight, setWeight] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const days = viewMode === 'weekly' ? 7 : 30;
      const [logData, latestData] = await Promise.all([
        getHealthLogs(user.uid, days),
        getLatestHealthEntry(user.uid),
      ]);
      setLogs(logData);
      setLatest(latestData);
    } catch (e) {
      console.log('Health load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, viewMode]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  const handleSave = async () => {
    if (!user) return;
    if (!heartRate && !bpSystolic && !weight) {
      Alert.alert('Error', isHindi ? 'कम से कम एक फ़ील्ड भरें' : 'Please fill at least one field');
      return;
    }
    setSaving(true);
    try {
      const entry = {
        heartRate: heartRate ? parseInt(heartRate) : null,
        bpSystolic: bpSystolic ? parseInt(bpSystolic) : null,
        bpDiastolic: bpDiastolic ? parseInt(bpDiastolic) : null,
        weight: weight ? parseFloat(weight) : null,
        date: new Date().getTime(),
      };
      const success = await saveHealthEntry(user.uid, entry);
      if (success) {
        Alert.alert(isHindi ? 'सफल' : 'Success', t('healthLogged'));
        setShowModal(false);
        setHeartRate(''); setBpSystolic(''); setBpDiastolic(''); setWeight('');
        loadData();
      } else {
        Alert.alert('Error', t('healthLogError'));
      }
    } catch (e) {
      Alert.alert('Error', t('healthLogError'));
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data
  const getChartData = (key) => {
    const filtered = logs.filter(l => l[key] != null).slice(0, viewMode === 'weekly' ? 7 : 30).reverse();
    if (filtered.length === 0) return [];
    const maxVal = Math.max(...filtered.map(l => l[key]));
    return filtered.map(l => ({
      value: l[key],
      height: maxVal > 0 ? (l[key] / maxVal) * 100 : 0,
      date: new Date(l.date),
    }));
  };

  const MetricCard = ({ icon: Icon, label, value, unit, color, bgColor }) => (
    <View style={{
      flex: 1,
      backgroundColor: bgColor || colors.card,
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: color + '20',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        <Icon size={20} color={color} />
      </View>
      <Text style={{ fontSize: 11, color: colors.subtext, fontWeight: '500', marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>
        {value || '—'}
      </Text>
      <Text style={{ fontSize: 11, color: colors.subtext, marginTop: 2 }}>
        {unit}
      </Text>
    </View>
  );

  const MiniBarChart = ({ data, color, label }) => {
    const barWidth = data.length > 0 ? Math.min(Math.floor((CHART_WIDTH - 20) / data.length) - 4, 24) : 20;
    return (
      <View style={{
        backgroundColor: colors.card, borderRadius: 20, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: colors.border,
      }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          {label}
        </Text>
        {data.length === 0 ? (
          <Text style={{ color: colors.subtext, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>
            {t('noHealthData')}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, paddingTop: 8 }}>
            {data.map((item, idx) => (
              <View key={idx} style={{ alignItems: 'center', marginHorizontal: 2, flex: 1 }}>
                <Text style={{ fontSize: 9, color: colors.subtext, marginBottom: 4 }}>
                  {item.value}
                </Text>
                <View style={{
                  width: barWidth,
                  height: Math.max(item.height, 4),
                  backgroundColor: color,
                  borderRadius: 6,
                  minHeight: 4,
                }} />
                <Text style={{ fontSize: 8, color: colors.subtext, marginTop: 4 }}>
                  {item.date.getDate()}/{item.date.getMonth() + 1}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 14, gap: 12,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{
            width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
          }}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
            {t('healthDashboard')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
          }}>
          <Plus size={22} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Metric Cards */}
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <MetricCard
              icon={Heart}
              label={t('heartRate')}
              value={latest?.heartRate}
              unit={t('bpm')}
              color="#EF4444"
              bgColor={isDark ? '#2D1010' : '#FFF5F5'}
            />
            <MetricCard
              icon={Droplets}
              label={t('bloodPressure')}
              value={latest?.bpSystolic ? `${latest.bpSystolic}/${latest.bpDiastolic || ''}` : null}
              unit={t('mmHg')}
              color="#3B82F6"
              bgColor={isDark ? '#0A1E2D' : '#F0F9FF'}
            />
            <MetricCard
              icon={Scale}
              label={t('weight')}
              value={latest?.weight}
              unit={t('kgUnit')}
              color="#22C55E"
              bgColor={isDark ? '#0D2818' : '#F0FDF4'}
            />
          </View>

          {/* View Mode Toggle */}
          <View style={{
            flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14,
            padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
          }}>
            <TouchableOpacity
              onPress={() => setViewMode('weekly')}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                backgroundColor: viewMode === 'weekly' ? colors.accent : 'transparent',
              }}>
              <Text style={{
                fontWeight: '600', fontSize: 13,
                color: viewMode === 'weekly' ? '#FFFFFF' : colors.subtext,
              }}>
                {t('weeklyTrends')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('monthly')}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                backgroundColor: viewMode === 'monthly' ? colors.accent : 'transparent',
              }}>
              <Text style={{
                fontWeight: '600', fontSize: 13,
                color: viewMode === 'monthly' ? '#FFFFFF' : colors.subtext,
              }}>
                {t('monthlyTrends')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Charts */}
          <MiniBarChart data={getChartData('heartRate')} color="#EF4444" label={`❤️ ${t('heartRate')} (${t('bpm')})`} />
          <MiniBarChart data={getChartData('bpSystolic')} color="#3B82F6" label={`🩸 ${t('bloodPressure')} (${t('systolic')})`} />
          <MiniBarChart data={getChartData('weight')} color="#22C55E" label={`⚖️ ${t('weight')} (${t('kgUnit')})`} />
        </ScrollView>
      )}

      {/* Add Entry Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{
          flex: 1, backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 24, paddingBottom: 40,
            }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Activity size={22} color={colors.accent} />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
                    {t('logEntry')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowModal(false)}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center',
                  }}>
                  <X size={18} color={colors.subtext} />
                </TouchableOpacity>
              </View>

              {/* Inputs */}
              <View style={{ gap: 14 }}>
                <ModalInput
                  label={`❤️ ${t('heartRate')} (${t('bpm')})`}
                  value={heartRate} onChange={setHeartRate}
                  placeholder="72" colors={colors}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <ModalInput
                      label={`🩸 ${t('systolic')}`}
                      value={bpSystolic} onChange={setBpSystolic}
                      placeholder="120" colors={colors}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ModalInput
                      label={`${t('diastolic')}`}
                      value={bpDiastolic} onChange={setBpDiastolic}
                      placeholder="80" colors={colors}
                    />
                  </View>
                </View>
                <ModalInput
                  label={`⚖️ ${t('weight')} (${t('kgUnit')})`}
                  value={weight} onChange={setWeight}
                  placeholder="65" colors={colors}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: colors.accent,
                  paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                  marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8,
                  shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                }}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    {t('saveEntry')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ModalInput({ label, value, onChange, placeholder, colors }) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.subtext, marginBottom: 6, marginLeft: 2 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.input, color: colors.inputText || colors.text,
          paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14,
          fontSize: 16, borderWidth: 1, borderColor: colors.border,
        }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        keyboardType="numeric"
      />
    </View>
  );
}
