import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { getDoseHistory } from '../services/medicineReminderService';

export default function MedicineHistoryScreen({ navigation }) {
  const { t, isHindi } = useLanguage();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [adherenceRate, setAdherenceRate] = useState(100);

  useEffect(() => {
    if (user) {
      getDoseHistory(user.uid, 30)
        .then((logs) => {
          setHistory(logs);
          
          // Compute adherence percentage
          if (logs.length > 0) {
            const takenCount = logs.filter(l => l.status === 'taken').length;
            const skipCount = logs.filter(l => l.status === 'skipped').length;
            const validDoses = logs.length - skipCount; // Skipped doses don't count against adherence
            const rate = validDoses > 0 ? Math.round((takenCount / validDoses) * 100) : 100;
            setAdherenceRate(rate);
          }
        })
        .catch((e) => console.log('Error loading history:', e))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const getStatusStyle = (status) => {
    if (status === 'taken') return { color: colors.success, bg: colors.successBg, label: t('taken'), icon: CheckCircle2 };
    if (status === 'missed') return { color: colors.danger, bg: colors.dangerBg, label: t('missed'), icon: XCircle };
    return { color: colors.subtext, bg: colors.input, label: t('skipped'), icon: AlertCircle };
  };

  const renderItem = ({ item }) => {
    const statusData = getStatusStyle(item.status);
    const StatusIcon = statusData.icon;

    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
        padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
            {item.medicineName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>
            ⏱ {item.time} • 📆 {item.date}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: statusData.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
          borderWidth: 1, borderColor: statusData.color + '40',
        }}>
          <StatusIcon size={14} color={statusData.color} />
          <Text style={{ color: statusData.color, fontSize: 11, fontWeight: '700' }}>
            {statusData.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{
            width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
          }}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          {t('medicineHistory')}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>
          
          {/* Adherence Header Card */}
          <View style={{
            backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 16,
            borderWidth: 1, borderColor: colors.border, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 13, color: colors.subtext, fontWeight: '600' }}>
              {t('adherence')} Rate (30 Days)
            </Text>
            <Text style={{ fontSize: 44, fontWeight: 'bold', color: colors.accent, marginTop: 4 }}>
              {adherenceRate}%
            </Text>
            <Text style={{ fontSize: 11, color: colors.subtext, marginTop: 4, textAlign: 'center' }}>
              {adherenceRate >= 80 
                ? (isHindi ? 'शानदार! आप अपनी दवाइयां समय पर ले रहे हैं।' : 'Great job! You are taking your medications consistently.')
                : (isHindi ? 'ध्यान दें: अधिक छूटी दवाइयों से स्वास्थ्य पर असर पड़ सकता है।' : 'Warning: High missed dose rate can affect your health.')}
            </Text>
          </View>

          {/* Chronological Logs List */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12, marginLeft: 2 }}>
              Dose Logs
            </Text>

            {history.length === 0 ? (
              <View style={{
                backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: 'center',
                justifyContent: 'center', borderWidth: 1, borderColor: colors.border, flex: 1
              }}>
                <Calendar size={36} color={colors.subtext} style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.subtext, fontSize: 13, textAlign: 'center' }}>
                  No medication history logged yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>

        </View>
      )}

    </SafeAreaView>
  );
}
