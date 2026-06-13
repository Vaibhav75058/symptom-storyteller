import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Clock, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { getUserSessions, deleteSession } from '../services/sessionService';

export default function SessionHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const { t, isHindi } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserSessions(user.uid);
      setSessions(data);
    } catch (err) {
      console.log('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const handleDelete = (sessionId, title) => {
    Alert.alert(
      isHindi ? 'बातचीत हटाएं' : 'Delete Chat',
      isHindi ? `क्या आप "${title}" की बातचीत हटाना चाहते हैं?` : `Are you sure you want to delete "${title}"?`,
      [
        { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        { 
          text: isHindi ? 'हटाएं' : 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSession(user.uid, sessionId);
            if (success) {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
            } else {
              Alert.alert('Error', isHindi ? 'हटाने में विफलता।' : 'Failed to delete session.');
            }
          }
        }
      ]
    );
  };

  const handleResume = (sessionId) => {
    // Navigate to the Chat tab and pass the sessionId parameter
    navigation.navigate('Tabs', {
      screen: 'Chat',
      params: { sessionId }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F6F3' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F0EFE8'
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <ArrowLeft size={24} color="#BA7517" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1A18', marginLeft: 16 }}>
          {isHindi ? 'सभी हालिया सत्र' : 'All Recent Sessions'}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#BA7517" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <MessageSquare size={48} color="#B5B3AC" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#888780', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            {isHindi 
              ? 'अभी तक कोई चैट रिकॉर्ड नहीं है। होम स्क्रीन पर जाएं और अपनी पहली जांच शुरू करें!'
              : 'No chat history found. Go to the Home Screen and start your first triage assessment!'}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {sessions.map((session) => {
            const isHighUrgency = session.urgency === 'high';
            const urgencyColor = isHighUrgency ? '#DC2626' : (session.urgency === 'moderate' ? '#D97706' : '#16A34A');
            const urgencyBg = isHighUrgency ? '#FEF2F2' : (session.urgency === 'moderate' ? '#FFFBEB' : '#F0FDF4');
            const SessionIcon = isHighUrgency ? AlertTriangle : (session.urgency === 'moderate' ? Clock : CheckCircle2);
            
            const dateStr = session.lastActive 
              ? new Date(session.lastActive).toLocaleDateString(undefined, { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                }) 
              : 'Recently';

            return (
              <View 
                key={session.id}
                style={{
                  backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
                  borderWidth: 1, borderColor: '#F0EFE8', flexDirection: 'row', alignItems: 'center'
                }}
              >
                <TouchableOpacity 
                  onPress={() => handleResume(session.id)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: urgencyBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <SessionIcon size={20} color={urgencyColor} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: '700', color: '#1A1A18', fontSize: 15 }} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={{ color: '#49454F', fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                      {session.lastMessage || 'Active recently'}
                    </Text>
                    <Text style={{ color: '#888780', fontSize: 11, marginTop: 4 }}>
                      {dateStr}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleDelete(session.id, session.title)}
                  style={{ padding: 8, marginLeft: 4 }}
                >
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
