import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Alert, Switch, Image, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Image as ImageIcon, Calendar, Clock, Plus, Trash2, Heart } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { saveReminder } from '../services/medicineReminderService';
import { scheduleMedicineNotification } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

export default function AddMedicineScreen({ navigation }) {
  const { t, isHindi } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Basic Details
  const [medicineName, setMedicineName] = useState('');
  const [description, setDescription] = useState('');
  
  // Dosage Unit & Value
  const [dosage, setDosage] = useState('1');
  const [dosageUnit, setDosageUnit] = useState('Tablet'); // Tablet, Capsule, ml, Injection

  // Medicine Type
  const [medicineType, setMedicineType] = useState('tablet'); // tablet, capsule, syrup, injection, drops, cream

  // Frequency
  const [frequency, setFrequency] = useState('Once'); // Once, Twice, Three, Four, Custom
  const [times, setTimes] = useState(['08:00']);

  // Date Duration
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [durationPreset, setDurationPreset] = useState('7'); // 7, 15, 30, ongoing
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Time Pickers
  const [activeTimeIndex, setActiveTimeIndex] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Repeat Options
  const [repeatOption, setRepeatOption] = useState('Daily'); // Daily, Alternate Days, Weekly, Specific Days
  const [repeatDays, setRepeatDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

  // Prescription Photo
  const [prescriptionPhotoUri, setPrescriptionPhotoUri] = useState(null);

  // Reminders & Alerts
  const [voiceReminder, setVoiceReminder] = useState(false);
  const [caretakerName, setCaretakerName] = useState('');
  const [caretakerPhone, setCaretakerPhone] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [remainingQuantity, setRemainingQuantity] = useState('');

  const dosagePresets = [
    { label: isHindi ? '1 टैबलेट' : '1 Tablet', val: '1', unit: 'Tablet' },
    { label: isHindi ? '2 टैबलेट' : '2 Tablets', val: '2', unit: 'Tablet' },
    { label: isHindi ? '5 मिली सिरप' : '5 ml Syrup', val: '5', unit: 'ml' },
    { label: isHindi ? '1 इंजेक्शन' : '1 Injection', val: '1', unit: 'Injection' }
  ];

  const typePresets = [
    { label: t('tablet'), val: 'tablet' },
    { label: t('capsule'), val: 'capsule' },
    { label: t('syrup'), val: 'syrup' },
    { label: t('injection'), val: 'injection' },
    { label: t('drops'), val: 'drops' },
    { label: t('cream'), val: 'cream' }
  ];

  const frequencyPresets = [
    { label: t('onceADay'), val: 'Once', defaultTimes: ['08:00'] },
    { label: t('twiceADay'), val: 'Twice', defaultTimes: ['08:00', '20:00'] },
    { label: t('threeTimesADay'), val: 'Three', defaultTimes: ['08:00', '13:00', '20:00'] },
    { label: t('fourTimesADay'), val: 'Four', defaultTimes: ['08:00', '13:00', '17:00', '21:00'] }
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handlePickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery permission is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPrescriptionPhotoUri(result.assets[0].uri);
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (durationPreset !== 'ongoing') {
        const days = parseInt(durationPreset);
        setEndDate(new Date(selectedDate.getTime() + days * 24 * 60 * 60 * 1000));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setDurationPreset('custom');
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime && activeTimeIndex !== null) {
      const newTimes = [...times];
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const mins = selectedTime.getMinutes().toString().padStart(2, '0');
      newTimes[activeTimeIndex] = `${hours}:${mins}`;
      setTimes(newTimes);
    }
    setActiveTimeIndex(null);
  };

  const setDurationDays = (days) => {
    setDurationPreset(days);
    if (days === 'ongoing') {
      setEndDate(null);
    } else {
      const daysNum = parseInt(days);
      setEndDate(new Date(startDate.getTime() + daysNum * 24 * 60 * 60 * 1000));
    }
  };

  const toggleDay = (day) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter(d => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!medicineName.trim()) {
      Alert.alert(isHindi ? 'त्रुटि' : 'Error', isHindi ? 'कृपया दवाई का नाम दर्ज करें' : 'Please enter medicine name');
      return;
    }

    const reminder = {
      medicineName: medicineName.trim(),
      description: description.trim(),
      dosage,
      dosageUnit,
      medicineType,
      frequency,
      times,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      totalDays: durationPreset === 'ongoing' ? 'ongoing' : durationPreset,
      repeatOption,
      repeatDays: repeatOption === 'Specific Days' ? repeatDays : null,
      totalQuantity: totalQuantity ? parseInt(totalQuantity) : null,
      remainingQuantity: remainingQuantity ? parseInt(remainingQuantity) : (totalQuantity ? parseInt(totalQuantity) : null),
      prescriptionPhotoUri,
      voiceReminder,
      caretakerName: caretakerName.trim(),
      caretakerPhone: caretakerPhone.trim(),
      active: true,
    };

    try {
      const saved = await saveReminder(user.uid, reminder);
      if (saved) {
        // Schedule notification
        const notificationIds = await scheduleMedicineNotification(saved);
        if (notificationIds.length > 0) {
          saved.notificationIds = notificationIds;
          await saveReminder(user.uid, saved);
        }

        Alert.alert(isHindi ? 'सफल' : 'Success', t('medicineSaved'));
        navigation.goBack();
      } else {
        Alert.alert('Error', t('medicineSaveError'));
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', t('medicineSaveError'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
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
            {t('addMedicine')}
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          {/* Card 1: Name and description */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 8 }}>
              {t('medicineName')} *
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.input, color: colors.inputText || colors.text,
                paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
                fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16
              }}
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder="e.g. Crocin, Metformin"
              placeholderTextColor={colors.subtext}
            />

            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 8 }}>
              {t('medicineDescription')}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.input, color: colors.inputText || colors.text,
                paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
                fontSize: 14, borderWidth: 1, borderColor: colors.border,
              }}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. After lunch, for blood sugar control"
              placeholderTextColor={colors.subtext}
            />
          </View>

          {/* Card 2: Dosage Presets */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 12 }}>
              {t('dosage')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {dosagePresets.map((p, idx) => (
                <TouchableOpacity key={idx}
                  onPress={() => { setDosage(p.val); setDosageUnit(p.unit); }}
                  style={{
                    backgroundColor: (dosage === p.val && dosageUnit === p.unit) ? colors.accent : colors.input,
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                  }}>
                  <Text style={{
                    fontWeight: '600', fontSize: 13,
                    color: (dosage === p.val && dosageUnit === p.unit) ? '#FFFFFF' : colors.text
                  }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
                  Qty
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.input, color: colors.inputText || colors.text,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                    fontSize: 14, borderWidth: 1, borderColor: colors.border,
                  }}
                  value={dosage}
                  onChangeText={setDosage}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
                  Unit
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.input, color: colors.inputText || colors.text,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                    fontSize: 14, borderWidth: 1, borderColor: colors.border,
                  }}
                  value={dosageUnit}
                  onChangeText={setDosageUnit}
                  placeholder="e.g. Tablet, ml, Capsule"
                  placeholderTextColor={colors.subtext}
                />
              </View>
            </View>
          </View>

          {/* Card 3: Medicine Type */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 12 }}>
              {t('medicineType')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {typePresets.map((tPreset, idx) => (
                <TouchableOpacity key={idx}
                  onPress={() => setMedicineType(tPreset.val)}
                  style={{
                    backgroundColor: medicineType === tPreset.val ? colors.accent : colors.input,
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                  }}>
                  <Text style={{
                    fontWeight: '600', fontSize: 13,
                    color: medicineType === tPreset.val ? '#FFFFFF' : colors.text
                  }}>
                    {tPreset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Card 4: Frequency */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 12 }}>
              {t('frequency')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {frequencyPresets.map((fPreset, idx) => (
                <TouchableOpacity key={idx}
                  onPress={() => {
                    setFrequency(fPreset.val);
                    setTimes(fPreset.defaultTimes);
                  }}
                  style={{
                    backgroundColor: frequency === fPreset.val ? colors.accent : colors.input,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
                  }}>
                  <Text style={{
                    fontWeight: '600', fontSize: 12,
                    color: frequency === fPreset.val ? '#FFFFFF' : colors.text
                  }}>
                    {fPreset.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setFrequency('Custom')}
                style={{
                  backgroundColor: frequency === 'Custom' ? colors.accent : colors.input,
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
                }}>
                <Text style={{
                  fontWeight: '600', fontSize: 12,
                  color: frequency === 'Custom' ? '#FFFFFF' : colors.text
                }}>
                  {t('customFrequency')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Times list */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 10 }}>
              {t('timeSelection')}
            </Text>
            <View style={{ gap: 8 }}>
              {times.map((time, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTimeIndex(idx);
                      setShowTimePicker(true);
                    }}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: colors.input, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
                      borderWidth: 1, borderColor: colors.border
                    }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                      {time}
                    </Text>
                    <Clock size={18} color={colors.subtext} />
                  </TouchableOpacity>
                  
                  {frequency === 'Custom' && times.length > 1 && (
                    <TouchableOpacity
                      onPress={() => setTimes(times.filter((_, i) => i !== idx))}
                      style={{
                        width: 44, height: 44, borderRadius: 14, backgroundColor: colors.dangerBg,
                        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
                      }}>
                      <Trash2 size={18} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {frequency === 'Custom' && (
              <TouchableOpacity
                onPress={() => setTimes([...times, '08:00'])}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderColor: colors.accent, borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, marginTop: 12
                }}>
                <Plus size={16} color={colors.accent} strokeWidth={2.5} />
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
                  Add Dose Time
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Card 5: Duration */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 12 }}>
              {t('duration')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                { label: isHindi ? '7 दिन' : '7 Days', val: '7' },
                { label: isHindi ? '15 दिन' : '15 Days', val: '15' },
                { label: isHindi ? '30 दिन' : '30 Days', val: '30' },
                { label: t('ongoing'), val: 'ongoing' }
              ].map((dPreset, idx) => (
                <TouchableOpacity key={idx}
                  onPress={() => setDurationDays(dPreset.val)}
                  style={{
                    backgroundColor: durationPreset === dPreset.val ? colors.accent : colors.input,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
                  }}>
                  <Text style={{
                    fontWeight: '600', fontSize: 12,
                    color: durationPreset === dPreset.val ? '#FFFFFF' : colors.text
                  }}>
                    {dPreset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Pickers */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
                  {t('startDate')}
                </Text>
                <TouchableOpacity onPress={() => setShowStartDatePicker(true)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
                  }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <Calendar size={16} color={colors.subtext} />
                </TouchableOpacity>
              </View>

              {durationPreset !== 'ongoing' && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
                    {t('endDate')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(true)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: colors.input, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
                    }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                      {endDate ? endDate.toLocaleDateString() : '—'}
                    </Text>
                    <Calendar size={16} color={colors.subtext} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Card 6: Repeat Options */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 12 }}>
              {t('repeatOption')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {['Daily', 'Alternate Days', 'Weekly', 'Specific Days'].map((opt, idx) => (
                <TouchableOpacity key={idx}
                  onPress={() => setRepeatOption(opt)}
                  style={{
                    backgroundColor: repeatOption === opt ? colors.accent : colors.input,
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
                  }}>
                  <Text style={{
                    fontWeight: '600', fontSize: 12,
                    color: repeatOption === opt ? '#FFFFFF' : colors.text
                  }}>
                    {opt === 'Daily' ? t('daily') : (opt === 'Alternate Days' ? t('alternateDays') : (opt === 'Weekly' ? t('weekly') : t('specificDays')))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {repeatOption === 'Specific Days' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {daysOfWeek.map((day, idx) => {
                  const isSelected = repeatDays.includes(day);
                  const disp = isHindi ? day.substring(0, 3) : day.substring(0, 3);
                  return (
                    <TouchableOpacity key={idx}
                      onPress={() => toggleDay(day)}
                      style={{
                        backgroundColor: isSelected ? colors.accentLight : colors.input,
                        borderWidth: 1, borderColor: isSelected ? colors.accent : colors.border,
                        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'
                      }}>
                      <Text style={{ fontWeight: '700', fontSize: 12, color: isSelected ? colors.accent : colors.text }}>
                        {disp}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Card 7: Prescription Photo & Alerts */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 12 }}>
              {t('prescriptionPhoto')}
            </Text>
            {prescriptionPhotoUri ? (
              <View style={{ marginBottom: 14, position: 'relative' }}>
                <Image source={{ uri: prescriptionPhotoUri }} style={{ width: '100%', height: 160, borderRadius: 16 }} />
                <TouchableOpacity
                  onPress={() => setPrescriptionPhotoUri(null)}
                  style={{
                    position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18,
                    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center'
                  }}>
                  <Trash2 size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => handlePickImage(true)}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: colors.input, borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border
                  }}>
                  <Camera size={18} color={colors.subtext} />
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                    {t('camera')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handlePickImage(false)}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: colors.input, borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border
                  }}>
                  <ImageIcon size={18} color={colors.subtext} />
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                    {t('gallery')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Voice reminder switch */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {t('voiceReminder')}
                </Text>
                <Text style={{ fontSize: 11, color: colors.subtext }}>
                  Speak medication name aloud
                </Text>
              </View>
              <Switch value={voiceReminder} onValueChange={setVoiceReminder} trackColor={{ true: colors.accent }} />
            </View>

            {/* Quantity inputs for refills */}
            <View style={{ flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
                  Total Qty
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.input, color: colors.inputText || colors.text,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                    fontSize: 13, borderWidth: 1, borderColor: colors.border
                  }}
                  value={totalQuantity}
                  onChangeText={setTotalQuantity}
                  placeholder="e.g. 30"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
                  Remaining Qty
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.input, color: colors.inputText || colors.text,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                    fontSize: 13, borderWidth: 1, borderColor: colors.border
                  }}
                  value={remainingQuantity}
                  onChangeText={setRemainingQuantity}
                  placeholder="e.g. 15"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Card 8: Caretaker details */}
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Heart size={18} color={colors.accent} fill={colors.accent} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                {t('caretaker')}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>
              Get SMS/WhatsApp notifications if this medicine is missed.
            </Text>
            
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
              {t('caretakerName')}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.input, color: colors.inputText || colors.text,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12
              }}
              value={caretakerName}
              onChangeText={setCaretakerName}
              placeholder="e.g. Amit"
              placeholderTextColor={colors.subtext}
            />

            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 6 }}>
              {t('caretakerPhone')}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.input, color: colors.inputText || colors.text,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                fontSize: 14, borderWidth: 1, borderColor: colors.border
              }}
              value={caretakerPhone}
              onChangeText={setCaretakerPhone}
              placeholder="e.g. +919999999999"
              placeholderTextColor={colors.subtext}
              keyboardType="phone-pad"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: colors.accent,
              paddingVertical: 16, borderRadius: 18, alignItems: 'center',
              justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
            }}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
              {t('saveMedicine')}
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Date Time Picker Overlays */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={startDate}
          />
        )}

        {showTimePicker && activeTimeIndex !== null && (
          <DateTimePicker
            value={(() => {
              const [h, m] = times[activeTimeIndex].split(':').map(Number);
              const d = new Date();
              d.setHours(h);
              d.setMinutes(m);
              return d;
            })()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
