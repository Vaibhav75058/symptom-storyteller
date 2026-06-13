import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, Camera, Pill, Stethoscope, Clock, ArrowRight, 
  MessageSquare, ScanLine, PlusSquare, MapPin, Globe, AlertTriangle, CheckCircle2,
  Heart, Droplets, Scale, ShieldAlert, Check
} from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { getUserSessions } from '../services/sessionService';
import { getLatestHealthEntry } from '../services/healthService';
import { getTodaysDoses, saveDoseLog, updateRemainingQuantity } from '../services/medicineReminderService';
import { speakMedicineReminder, scheduleRefillReminder } from '../services/notificationService';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t, isHindi, toggleLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const isFocused = useIsFocused();
  const [recentSessions, setRecentSessions] = useState([]);
  const [latestHealth, setLatestHealth] = useState(null);
  const [todaysDoses, setTodaysDoses] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.displayName?.split(' ')[0] || 'Guest';

  const loadHomeData = useCallback(async () => {
    if (!user) return;
    try {
      const [sessions, health, doses] = await Promise.all([
        getUserSessions(user.uid),
        getLatestHealthEntry(user.uid),
        getTodaysDoses(user.uid)
      ]);
      setRecentSessions(sessions.slice(0, 3));
      setLatestHealth(health);
      setTodaysDoses(doses.slice(0, 3));
    } catch (err) {
      console.log('Home Load Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isFocused && user) {
      loadHomeData();
    }
  }, [isFocused, user, loadHomeData]);

  const handleQuickDoseConfirm = async (dose, status) => {
    if (!user) return;
    try {
      const log = {
        reminderId: dose.reminderId,
        medicineName: dose.medicineName,
        date: dose.date,
        time: dose.time,
        status: status,
      };
      await saveDoseLog(user.uid, log);

      if (status === 'taken') {
        const currentQty = dose.remainingQuantity;
        if (currentQty !== null && currentQty !== undefined) {
          const newQty = Math.max(0, currentQty - 1);
          await updateRemainingQuantity(user.uid, dose.reminderId, newQty);
          if (newQty <= 3) {
            scheduleRefillReminder(dose.medicineName, newQty);
          }
        }
        if (dose.voiceReminder) {
          speakMedicineReminder(dose.medicineName, isHindi);
        }
      }
      loadHomeData();
    } catch (e) {
      console.log('Quick confirm error:', e);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  const cards = [
    {
      title: t('aiChat'),
      desc: t('aiChatDesc'),
      icon: MessageCircle,
      bg: isDark ? '#2A2010' : '#FFF3E8', 
      iconBg: isDark ? '#3D2E1A' : '#FFE6CD', 
      iconColor: isDark ? '#D4922A' : '#DE6E1B', 
      arrowBg: isDark ? '#D4922A' : '#DE6E1B',
      route: 'Chat', Watermark: MessageSquare
    },
    {
      title: t('cameraScan'),
      desc: t('cameraScanDesc'),
      icon: Camera,
      bg: isDark ? '#2D2505' : '#FFF9DE', 
      iconBg: isDark ? '#3E340E' : '#FFF1B8', 
      iconColor: isDark ? '#EAB308' : '#D98900', 
      arrowBg: isDark ? '#EAB308' : '#EAB308',
      route: 'Scan', Watermark: ScanLine
    },
    {
      title: t('medicineInfo'),
      desc: t('medicineInfoDesc'),
      icon: Pill,
      bg: isDark ? '#0D2818' : '#F0FDF4', 
      iconBg: isDark ? '#143E23' : '#DCFCE7', 
      iconColor: isDark ? '#22C55E' : '#16A34A', 
      arrowBg: isDark ? '#22C55E' : '#22C55E',
      route: 'MedicineScanner', Watermark: PlusSquare
    },
    {
      title: t('findDoctors'),
      desc: t('findDoctorsDesc'),
      icon: Stethoscope,
      bg: isDark ? '#0A1E2D' : '#F0F9FF', 
      iconBg: isDark ? '#13354C' : '#E0F2FE', 
      iconColor: isDark ? '#38BDF8' : '#0284C7', 
      arrowBg: isDark ? '#38BDF8' : '#0EA5E9',
      route: 'Doctors', Watermark: MapPin
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Header with Language Toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, color: colors.subtext }}>
              {getGreeting()}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.accent }}>
              {firstName}
            </Text>
          </View>

          {/* Hindi/English Toggle */}
          <TouchableOpacity
            onPress={toggleLanguage}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: isHindi ? (isDark ? '#2A2010' : '#FFF3E8') : (isDark ? '#0A1E2D' : '#F0F9FF'),
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              borderWidth: 1, borderColor: isHindi ? (isDark ? '#3D2E1A' : '#FFE6CD') : (isDark ? '#13354C' : '#E0F2FE'),
            }}
          >
            <Globe size={16} color={isHindi ? colors.accent : (isDark ? '#38BDF8' : '#0284C7')} />
            <Text style={{ fontWeight: '700', fontSize: 13, color: isHindi ? colors.accent : (isDark ? '#38BDF8' : '#0284C7') }}>
              {isHindi ? 'EN' : 'हिं'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Health Summary Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('HealthDashboard')}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 16,
            marginTop: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: colors.shadow,
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 1
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              {t('healthDashboard')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Heart size={14} color="#EF4444" fill="#EF4444" />
                <Text style={{ fontSize: 12, color: colors.subtext, fontWeight: '600' }}>
                  {latestHealth?.heartRate ? `${latestHealth.heartRate} bpm` : '—'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Droplets size={14} color="#3B82F6" />
                <Text style={{ fontSize: 12, color: colors.subtext, fontWeight: '600' }}>
                  {latestHealth?.bpSystolic ? `${latestHealth.bpSystolic}/${latestHealth.bpDiastolic || ''}` : '—'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Scale size={14} color="#22C55E" />
                <Text style={{ fontSize: 12, color: colors.subtext, fontWeight: '600' }}>
                  {latestHealth?.weight ? `${latestHealth.weight} kg` : '—'}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={16} color={colors.accent} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Premium Medicine Reminder & Alarms Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('MedicineReminder')}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: colors.shadow,
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 1
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              ⏰ {t('medicineReminder')}
            </Text>
            <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
              {isHindi ? 'दवाइयों के अलार्म और शेड्यूल प्रबंधित करें' : 'Manage medicine alarms & schedules'}
            </Text>
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={16} color={colors.accent} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
          {t('howCanWeHelp')}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            const Watermark = card.Watermark;
            return (
              <TouchableOpacity
                key={idx}
                style={{ 
                  width: '48%', 
                  aspectRatio: 0.85, 
                  backgroundColor: card.bg,
                  borderRadius: 24,
                  padding: 16,
                  marginBottom: 16,
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}
                onPress={() => {
                  if (card.route === 'Chat') {
                    navigation.navigate('Chat', { sessionId: null, key: Date.now().toString() });
                  } else {
                    navigation.navigate(card.route);
                  }
                }}
              >
                <View style={{ position: 'absolute', top: 10, right: -15, opacity: isDark ? 0.3 : 0.6, transform: [{ rotate: '10deg' }] }}>
                  <Watermark size={90} color={card.iconBg} strokeWidth={1.5} />
                </View>

                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: card.iconBg, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <Icon size={24} color={card.iconColor} strokeWidth={2.5} />
                </View>

                <View style={{ marginTop: 12, zIndex: 10 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: isHindi ? 14 : 16, marginBottom: 4 }}>
                    {card.title}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: isHindi ? 10 : 11, lineHeight: isHindi ? 15 : 16, paddingRight: 20 }}>
                    {card.desc}
                  </Text>
                  
                  <View style={{ position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: card.arrowBg, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Today's Due Medicines Quick View */}
        {todaysDoses.length > 0 && (
          <View style={{ marginTop: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                {t('todaysMedicines')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('MedicineReminder')}>
                <Text style={{ color: colors.accent, fontWeight: '500' }}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>

            {todaysDoses.map((dose) => (
              <View
                key={dose.id}
                style={{
                  backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    {dose.medicineName}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>
                    ⏱ {dose.time} • {dose.dosage} {dose.dosageUnit}
                  </Text>
                </View>

                {dose.status === 'pending' ? (
                  <TouchableOpacity
                    onPress={() => handleQuickDoseConfirm(dose, 'taken')}
                    style={{
                      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.successBg,
                      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.success
                    }}>
                    <Check size={18} color={colors.success} strokeWidth={3} />
                  </TouchableOpacity>
                ) : (
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: dose.status === 'taken' ? colors.success : colors.danger
                  }}>
                    {dose.status === 'taken' ? t('taken') : t('missed')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recent Chat Sessions */}
        <View style={{ marginTop: 6, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
            {t('recentSessions')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SessionHistory')}>
            <Text style={{ color: colors.accent, fontWeight: '500' }}>{t('seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentSessions.length === 0 ? (
          <View style={{
            backgroundColor: colors.card, borderRadius: 16, padding: 24, marginTop: 12, marginBottom: 8,
            borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={24} color={colors.subtext} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.subtext, fontSize: 13, textAlign: 'center' }}>
              {isHindi ? 'कोई हालिया बातचीत नहीं है। ऊपर AI चैट पर क्लिक करके शुरू करें!' : 'No recent sessions. Start a chat above to begin!'}
            </Text>
          </View>
        ) : (
          recentSessions.map((session) => {
            const isHighUrgency = session.urgency === 'high';
            const urgencyColor = isHighUrgency ? colors.danger : (session.urgency === 'moderate' ? colors.warning : colors.success);
            const urgencyBg = isHighUrgency ? colors.dangerBg : (session.urgency === 'moderate' ? colors.warningBg : colors.successBg);
            const SessionIcon = isHighUrgency ? AlertTriangle : (session.urgency === 'moderate' ? Clock : CheckCircle2);

            return (
              <TouchableOpacity
                key={session.id}
                onPress={() => navigation.navigate('Chat', { sessionId: session.id })}
                style={{
                  backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 12, marginBottom: 8,
                  borderWidth: 1, borderColor: colors.border,
                  flexDirection: 'row', alignItems: 'center'
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: urgencyBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <SessionIcon size={20} color={urgencyColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {session.lastMessage || 'Active recently'}
                  </Text>
                </View>
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>{t('view')}</Text>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
