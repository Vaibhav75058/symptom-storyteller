import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Star, Navigation as NavIcon, AlertTriangle } from 'lucide-react-native';
import { fetchNearbyHealthcare } from '../services/doctorService';

export default function DoctorFinderScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = ['All', 'Clinic', 'Hospital', '< 2km', '< 5km'];

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNearbyHealthcare();
      setPlaces(data);
    } catch (err) {
      setError(err.message || 'Failed to find nearby doctors');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (lat, lon) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Google Maps is not installed or cannot be opened');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  const filteredPlaces = places.filter(place => {
    // Text search
    if (search && !place.name.toLowerCase().includes(search.toLowerCase()) && !place.type.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Category filter
    if (filter === 'Clinic' && place.type !== 'Clinic') return false;
    if (filter === 'Hospital' && place.type !== 'Hospital') return false;
    if (filter === '< 2km' && place.distance > 2) return false;
    if (filter === '< 5km' && place.distance > 5) return false;
    return true;
  });

  const renderDoctor = ({ item }) => (
    <View className="bg-white dark:bg-surfaceDark p-5 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-800">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-2">
          <Text className="font-poppins font-bold text-textLight dark:text-textDark text-lg">{item.name}</Text>
          <Text className="font-dmSans text-primary dark:text-primary">{item.type}</Text>
        </View>
        <View className="flex-row items-center bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg">
          <Star size={14} color="#d97706" fill="#d97706" />
          <Text className="font-dmSans font-bold text-orange-700 dark:text-orange-300 ml-1">4.5</Text>
        </View>
      </View>
      
      <View className="flex-row items-center mb-4">
        <MapPin size={14} color="#A09F9B" />
        <Text className="font-dmSans text-textLight/60 dark:text-textDark/60 ml-1 text-sm flex-1" numberOfLines={1}>
          {item.address} • {item.distance} km
        </Text>
      </View>

      <TouchableOpacity 
        className="bg-surfaceLight dark:bg-bgDark py-3 rounded-xl flex-row items-center justify-center"
        onPress={() => openInMaps(item.lat, item.lon)}
      >
        <NavIcon size={16} color="#534AB7" />
        <Text className="font-poppins font-semibold text-primary ml-2">Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surfaceLight dark:bg-bgDark">
      <View className="p-6 flex-1">
        <Text className="text-3xl font-poppins font-bold text-textLight dark:text-textDark mb-4">
          Find Doctors
        </Text>
        
        <View className="bg-white dark:bg-surfaceDark rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-2 mb-4 flex-row items-center shadow-sm">
          <TextInput
            className="flex-1 font-dmSans text-textLight dark:text-textDark py-2"
            placeholder="Search by specialist or clinic..."
            placeholderTextColor="#A09F9B"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((f, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setFilter(f)}
                className={`px-4 py-2 rounded-full mr-2 ${filter === f ? 'bg-warning border-transparent' : 'bg-white dark:bg-surfaceDark border border-gray-200 dark:border-gray-800'}`}
              >
                <Text className={`font-dmSans font-medium ${filter === f ? 'text-white' : 'text-textLight dark:text-textDark'}`}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#534AB7" />
            <Text className="text-gray-500 font-dmSans mt-4">Locating nearby facilities...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <AlertTriangle size={48} color="#EF4444" className="mb-4" />
            <Text className="text-textLight dark:text-textDark font-poppins font-semibold text-lg text-center mb-2">Location Error</Text>
            <Text className="text-gray-500 font-dmSans text-center mb-6">{error}</Text>
            <TouchableOpacity 
              className="bg-primary py-3 px-8 rounded-xl shadow-sm"
              onPress={loadDoctors}
            >
              <Text className="text-white font-poppins font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredPlaces}
            keyExtractor={item => item.id}
            renderItem={renderDoctor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="py-10 items-center">
                <Text className="text-gray-500 font-dmSans">No results found for your filters.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
