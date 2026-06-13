import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { useLanguage } from '../hooks/useLanguage';

export default function TriageResultScreen({ route, navigation }) {
  const { t, isHindi, toggleLanguage } = useLanguage();
  const { result } = route.params || {
    result: {
      visible_observations: "Sample observation", 
      possible_conditions: ["Condition 1"], 
      urgency: "low", 
      recommended_specialist: "General Physician", 
      advice: "Sample advice", 
      disclaimer: "Disclaimer" 
    }
  };

  const hasSpecialist = result.recommended_specialist && result.recommended_specialist.toLowerCase() !== 'none';

  const getUrgencyConfig = (urgency) => {
    switch(urgency) {
      case 'low': return { iconColor: '#1D9E75', bgColor: '#F0FDF4', borderColor: '#DCFCE7', icon: CheckCircle2, text: t('lowUrgency'), textColor: '#166534' };
      case 'moderate': return { iconColor: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A', icon: AlertCircle, text: t('moderateUrgency'), textColor: '#92400E' };
      case 'high': return { iconColor: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA', icon: AlertTriangle, text: t('highUrgency'), textColor: '#991B1B' };
      default: return { iconColor: '#1D9E75', bgColor: '#F0FDF4', borderColor: '#DCFCE7', icon: CheckCircle2, text: t('lowUrgency'), textColor: '#166534' };
    }
  };

  const uConfig = getUrgencyConfig(result.urgency);
  const Icon = uConfig.icon;

  // Navigate to Doctors tab — need to go up to parent tab navigator
  const handleFindDoctor = () => {
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Doctors');
      } else {
        navigation.navigate('Doctors');
      }
    } catch (e) {
      navigation.navigate('Doctors');
    }
  };

  const handleDone = () => {
    try {
      // 1. Reset the current stack navigator to start fresh from Camera
      navigation.reset({
        index: 0,
        routes: [{ name: 'Camera' }],
      });

      // 2. Navigate back to Home tab
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Home');
      } else {
        navigation.navigate('Home');
      }
    } catch (e) {
      // Fallback to Home tab directly
      try {
        navigation.navigate('Home');
      } catch (err) {
        navigation.goBack();
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        
        {/* Header with Language Toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1A1A18' }}>
            {t('triageResult')}
          </Text>
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

        {/* Urgency Badge */}
        <View style={{
          backgroundColor: uConfig.bgColor, padding: 16, borderRadius: 16,
          flexDirection: 'row', alignItems: 'center', marginBottom: 20,
          borderWidth: 1, borderColor: uConfig.borderColor
        }}>
          <Icon color={uConfig.iconColor} size={24} />
          <Text style={{ marginLeft: 12, fontWeight: 'bold', fontSize: 17, color: uConfig.textColor }}>
            {uConfig.text}
          </Text>
        </View>

        {/* Observations */}
        <View style={cardStyle}>
          <Text style={labelStyle}>{t('observations')}</Text>
          <Text style={{ fontWeight: '600', fontSize: 16, color: '#1A1A18', lineHeight: 24 }}>
            {result.visible_observations}
          </Text>
        </View>

        {/* Possible Conditions */}
        {result.possible_conditions && result.possible_conditions.length > 0 && (
          <View style={cardStyle}>
            <Text style={labelStyle}>{t('possibleConditions')}</Text>
            {result.possible_conditions.map((c, i) => (
              <View key={i} style={{
                backgroundColor: '#F7F6F3', paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 10, marginBottom: 8, alignSelf: 'flex-start'
              }}>
                <Text style={{ fontWeight: '500', color: '#1A1A18', fontSize: 14 }}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommended Specialist */}
        {hasSpecialist && (
          <View style={cardStyle}>
            <Text style={labelStyle}>{t('recommendedSpecialist')}</Text>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#534AB7' }}>
              {result.recommended_specialist}
            </Text>
          </View>
        )}

        {/* Advice */}
        <View style={cardStyle}>
          <Text style={labelStyle}>{t('advice')}</Text>
          <Text style={{ fontSize: 14, color: '#49454F', lineHeight: 22 }}>
            {result.advice}
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={{
          backgroundColor: '#FEF3C7', padding: 14, borderRadius: 14,
          flexDirection: 'row', marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A'
        }}>
          <ShieldAlert size={18} color="#92400E" style={{ marginTop: 2, marginRight: 10 }} />
          <Text style={{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 }}>
            {result.disclaimer}
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Buttons */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0EFE8'
      }}>
        {hasSpecialist && (
          <TouchableOpacity 
            onPress={handleFindDoctor}
            style={{
              backgroundColor: '#BA7517', paddingVertical: 16, borderRadius: 14,
              alignItems: 'center', marginBottom: 8
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {t('find')} {result.recommended_specialist}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleDone}
          style={{ 
            backgroundColor: hasSpecialist ? 'transparent' : '#BA7517',
            paddingVertical: 16, 
            borderRadius: 14, 
            alignItems: 'center' 
          }}
        >
          <Text style={{ color: hasSpecialist ? '#888780' : '#fff', fontWeight: '700', fontSize: 16 }}>
            {t('done')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const cardStyle = {
  backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 14,
  borderWidth: 1, borderColor: '#F0EFE8',
  shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
};

const labelStyle = {
  fontSize: 12, color: '#888780', marginBottom: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5,
};
