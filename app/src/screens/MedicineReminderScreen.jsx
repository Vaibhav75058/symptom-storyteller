import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Plus, Clock, AlertTriangle, CheckCircle, RefreshCw, Calendar, Phone, PhoneCall, Trash2, Heart, Volume2
} from 'lucide-react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useIsFocused } from '@react-navigation/native';
import {
  getTodaysDoses, saveDoseLog, getUserReminders, deleteReminder,
  toggleReminder, updateRemainingQuantity
} from '../services/medicineReminderService';
import { cancelMedicineNotification, speakMedicineReminder, scheduleRefillReminder } from '../services/notificationService';

const { width } = Dimensions.get('window');

export default function MedicineReminderScreen({ navigation }) {
  const { t, isHindi } = useLanguage();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [todaysDoses, setTodaysDoses] = useState([]);
  const [allReminders, setAllReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('today'); // today | active

  // Summary stats
  const [stats, setStats] = useState({
    total: 0,
    taken: 0,
    missed: 0,
    nextTime: '—',
    nextMedName: '—',
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [doses, reminders] = await Promise.all([
        getTodaysDoses(user.uid),
        getUserReminders(user.uid)
      ]);
      
      setTodaysDoses(doses);
      setAllReminders(reminders);
      
      // Compute stats
      const total = doses.length;
      const taken = doses.filter(d => d.status === 'taken').length;
      const missed = doses.filter(d => d.status === 'missed').length;

      // Find next pending dose
      const nowStr = new Date().toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
      const pendingDoses = doses.filter(d => d.status === 'pending');
      const nextDose = pendingDoses.find(d => d.time.localeCompare(nowStr) >= 0) || pendingDoses[0];

      setStats({
        total,
        taken,
        missed,
        nextTime: nextDose ? nextDose.time : '—',
        nextMedName: nextDose ? nextDose.medicineName : '—',
      });
    } catch (e) {
      console.log('Error loading reminders data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const handleAction = async (dose, status) => {
    if (!user) return;
    try {
      const log = {
        reminderId: dose.reminderId,
        medicineName: dose.medicineName,
        date: dose.date,
        time: dose.time,
        status: status, // taken, missed, skipped
      };

      await saveDoseLog(user.uid, log);

      // Decrement quantity if taken
      if (status === 'taken') {
        const currentQty = dose.remainingQuantity;
        if (currentQty !== null && currentQty !== undefined) {
          const newQty = Math.max(0, currentQty - 1);
          await updateRemainingQuantity(user.uid, dose.reminderId, newQty);
          if (newQty <= 3) {
            scheduleRefillReminder(dose.medicineName, newQty);
          }
        }
      }

      // If voice reminder is on, speak it
      if (status === 'taken' && dose.voiceReminder) {
        speakMedicineReminder(dose.medicineName, isHindi);
      }

      // If marked missed, notify caretaker
      if (status === 'missed' && dose.caretakerPhone) {
        Alert.alert(
          isHindi ? 'केयरटेकर को सूचित करें?' : 'Notify Caretaker?',
          isHindi 
            ? `${dose.caretakerName || 'देखभालकर्ता'} को व्हाट्सएप / एसएमएस संदेश भेजें?`
            : `Send WhatsApp/SMS message to ${dose.caretakerName || 'Caretaker'}?`,
          [
            { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
            { text: isHindi ? 'भेजें' : 'Send', onPress: () => handleCaretakerAlert(dose) }
          ]
        );
      }

      loadData();
    } catch (e) {
      console.log('Action handler error:', e);
    }
  };

  const handleCaretakerAlert = (dose) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = isHindi
      ? `नमस्ते ${dose.caretakerName || 'देखभालकर्ता'}, आपके पिताजी/माताजी ने अपनी दवाई नहीं ली है: ${dose.medicineName} (${dose.time} बजे)। कृपया जांच करें।`
      : `Hello ${dose.caretakerName || 'Caretaker'}, your family member missed their medicine: ${dose.medicineName} at ${dose.time}. Please check on them.`;

    const cleanPhone = dose.caretakerPhone.replace(/\+/g, '').trim();
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`sms:${dose.caretakerPhone}?body=${encodeURIComponent(msg)}`);
      }
    }).catch(() => {
      Linking.openURL(`sms:${dose.caretakerPhone}?body=${encodeURIComponent(msg)}`);
    });
  };

  const handleDelete = async (reminderId, notificationIds) => {
    Alert.alert(
      isHindi ? 'हटाएं?' : 'Delete Reminder?',
      isHindi ? 'क्या आप इस दवाई रिमाइंडर को हटाना चाहते हैं?' : 'Are you sure you want to delete this medicine reminder?',
      [
        { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: isHindi ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const success = await deleteReminder(user.uid, reminderId);
            if (success) {
              if (notificationIds && notificationIds.length > 0) {
                await cancelMedicineNotification(notificationIds);
              }
              Alert.alert(isHindi ? 'सफल' : 'Success', t('medicineDeleted'));
              loadData();
            } else {
              Alert.alert('Error', 'Failed to delete reminder.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (reminderId, currentStatus) => {
    setLoading(true);
    await toggleReminder(user.uid, reminderId, !currentStatus);
    loadData();
  };

  const progressPercentage = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;

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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
            {t('medicineReminder')}
          </Text>
        </View>
        
        {/* History link */}
        <TouchableOpacity onPress={() => navigation.navigate('MedicineHistory')}
          style={{
            width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
          }}>
          <Calendar size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Toggle tabs */}
        <View style={{
          flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14,
          padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.border
        }}>
          <TouchableOpacity
            onPress={() => setActiveTab('today')}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
              backgroundColor: activeTab === 'today' ? colors.accent : 'transparent',
            }}>
            <Text style={{
              fontWeight: '600', fontSize: 13,
              color: activeTab === 'today' ? '#FFFFFF' : colors.subtext,
            }}>
              {t('todaysMedicines')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
              backgroundColor: activeTab === 'active' ? colors.accent : 'transparent',
            }}>
            <Text style={{
              fontWeight: '600', fontSize: 13,
              color: activeTab === 'active' ? '#FFFFFF' : colors.subtext,
            }}>
              {isHindi ? 'सभी दवाइयां' : 'All Medicines'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : activeTab === 'today' ? (
          <View>
            {/* Summary Dashboard Stats */}
            <View style={{
              backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.subtext, fontWeight: '600' }}>
                    {t('nextMedicine')}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>
                    {stats.nextMedName}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: 2 }}>
                    ⏱ {stats.nextTime}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: colors.subtext, fontWeight: '600' }}>
                    {t('progress')}
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 2 }}>
                    {stats.taken}/{stats.total}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={{ height: 8, backgroundColor: colors.input, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <View style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: colors.success }} />
              </View>
              <Text style={{ fontSize: 11, color: colors.subtext, textAlign: 'right' }}>
                {progressPercentage}% {isHindi ? 'सफल' : 'Completed'}
              </Text>
            </View>

            {/* Today's Dose List */}
            {todaysDoses.length === 0 ? (
              <View style={{
                backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center',
                justifyContent: 'center', borderWidth: 1, borderColor: colors.border
              }}>
                <Clock size={32} color={colors.subtext} style={{ marginBottom: 8 }} />
                <Text style={{ color: colors.subtext, fontSize: 13, textAlign: 'center' }}>
                  {t('noReminders')}
                </Text>
              </View>
            ) : (
              todaysDoses.map((dose) => {
                const isTaken = dose.status === 'taken';
                const isMissed = dose.status === 'missed';
                const isSkipped = dose.status === 'skipped';
                const isPending = dose.status === 'pending';

                return (
                  <View key={dose.id} style={{
                    backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center',
                  }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                          {dose.medicineName}
                        </Text>
                        {dose.voiceReminder && <Volume2 size={14} color={colors.accent} />}
                      </View>
                      <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>
                        {dose.dosage} {dose.dosageUnit} • {dose.description || 'No description'}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: 6 }}>
                        ⏱ {dose.time}
                      </Text>

                      {dose.remainingQuantity !== null && dose.remainingQuantity <= 3 && (
                        <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '700', marginTop: 4 }}>
                          ⚠️ {t('refillWarning').replace('{qty}', dose.remainingQuantity)}
                        </Text>
                      )}
                    </View>

                    {/* Status Actions */}
                    {isPending ? (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => handleAction(dose, 'taken')}
                          style={{
                            paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
                            backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.success
                          }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>
                            {t('taken')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleAction(dose, 'missed')}
                          style={{
                            paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
                            backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.danger
                          }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.danger }}>
                            {t('missed')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleAction(dose, 'skipped')}
                          style={{
                            paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
                            backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border
                          }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext }}>
                            {t('skip')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{
                          fontSize: 13, fontWeight: '700',
                          color: isTaken ? colors.success : (isMissed ? colors.danger : colors.subtext)
                        }}>
                          {isTaken ? `✓ ${t('taken')}` : (isMissed ? `✗ ${t('missed')}` : `⤼ ${t('skipped')}`)}
                        </Text>
                        <TouchableOpacity onPress={() => handleAction(dose, 'pending')}
                          style={{
                            width: 28, height: 28, borderRadius: 14, backgroundColor: colors.input,
                            alignItems: 'center', justifyContent: 'center'
                          }}>
                          <RefreshCw size={12} color={colors.subtext} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* Active Reminders List */
          <View>
            {allReminders.length === 0 ? (
              <View style={{
                backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center',
                justifyContent: 'center', borderWidth: 1, borderColor: colors.border
              }}>
                <Clock size={32} color={colors.subtext} style={{ marginBottom: 8 }} />
                <Text style={{ color: colors.subtext, fontSize: 13, textAlign: 'center' }}>
                  {t('noReminders')}
                </Text>
              </View>
            ) : (
              allReminders.map((reminder) => (
                <View key={reminder.id} style={{
                  backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 12,
                  borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center'
                }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                        {reminder.medicineName}
                      </Text>
                      <TouchableOpacity onPress={() => handleToggleActive(reminder.id, reminder.active)}
                        style={{
                          backgroundColor: reminder.active ? colors.successBg : colors.input,
                          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                          borderWidth: 1, borderColor: reminder.active ? colors.success : colors.border
                        }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: reminder.active ? colors.success : colors.subtext }}>
                          {reminder.active ? t('active') : t('paused')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>
                      {reminder.dosage} {reminder.dosageUnit} • {reminder.medicineType}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.subtext, marginTop: 4 }}>
                      Times: {reminder.times.join(', ')}
                    </Text>
                    
                    {reminder.caretakerName && (
                      <Text style={{ fontSize: 10, color: colors.accent, fontWeight: '600', marginTop: 4 }}>
                        👥 Caretaker: {reminder.caretakerName}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(reminder.id, reminder.notificationIds)}
                    style={{
                      width: 44, height: 44, borderRadius: 14, backgroundColor: colors.dangerBg,
                      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
                    }}>
                    <Trash2 size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Card: Emergency Contact Details */}
        <View style={{
          backgroundColor: isDark ? '#2D1010' : '#FFF5F5',
          borderRadius: 24, padding: 18, marginTop: 16,
          borderWidth: 1, borderColor: colors.danger + '40',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={20} color={colors.danger} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#FF6B6B' : '#791F1F' }}>
              {t('emergencyContacts')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => Linking.openURL('tel:108')}
              style={{
                flex: 1.2, backgroundColor: colors.danger, borderRadius: 14,
                paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              <PhoneCall size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                {t('ambulance')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Linking.openURL('tel:102')}
              style={{
                flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
                paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              <Phone size={14} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 13 }}>
                National
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* FAB to Add Medicine */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddMedicine')}
        style={{
          position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
          shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6
        }}>
        <Plus size={28} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}
