import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Linking, RefreshControl, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Phone, Navigation, RefreshCw, AlertTriangle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { fetchNearbyDoctors, openInGoogleMaps, openGoogleMapsSearch } from '../services/doctorService';

const FILTERS = ['All', 'Hospital', 'Clinic', 'Doctor'];

export default function DoctorsScreen({ route }) {
  const insets = useSafeAreaInsets();
  const specialistType = route?.params?.specialistType || null;

  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    getLocationAndFetch();
  }, []);

  const getLocationAndFetch = async () => {
    setLoading(true);
    setError(null);
    setFallback(false);

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('location_denied');
        setLoading(false);
        return;
      }

      // Get current location
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setLocation({ latitude, longitude });

      // Fetch nearby places
      const result = await fetchNearbyDoctors(latitude, longitude, specialistType, 5);

      if (result?.fallback) {
        // Overpass API down — show Google Maps fallback button
        setFallback(true);
        setPlaces([]);
      } else {
        setPlaces(result);
      }

    } catch (err) {
      console.error('Location/fetch error:', err);
      setError('general');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    getLocationAndFetch();
  };

  const openMaps = (place) => {
    const url = openInGoogleMaps(place.lat, place.lng, place.name);
    Linking.openURL(url);
  };

  const openMapsSearch = () => {
    if (!location) return;
    const url = openGoogleMapsSearch(specialistType, location.latitude, location.longitude);
    Linking.openURL(url);
  };

  // Filter places by type
  const filtered = activeFilter === 'All'
    ? places
    : places.filter(p => p.type === activeFilter);

  const getTypeColor = (type) => {
    if (type === 'Hospital') return { bg: '#FCEBEB', text: '#791F1F' };
    if (type === 'Clinic') return { bg: '#E1F5EE', text: '#085041' };
    return { bg: '#EEEDFE', text: '#3C3489' };
  };

  // ─── LOADING STATE ───────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F6F3', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#534AB7" />
        <Text style={{ marginTop: 16, color: '#888780', fontSize: 14 }}>Aapke aas paas dhundh rahe hain...</Text>
      </View>
    );
  }

  // ─── LOCATION DENIED ─────────────────────────────────────
  if (error === 'location_denied') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F6F3', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <MapPin size={48} color="#888780" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A18', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
          Location Permission Chahiye
        </Text>
        <Text style={{ fontSize: 14, color: '#888780', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Nearby doctors dhundhne ke liye location access zarori hai. Settings mein jaake permission dein.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{ backgroundColor: '#534AB7', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Settings Kholein</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── MAIN SCREEN ─────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6F3' }}>

      {/* Header */}
      <View style={{
        paddingTop: insets.top,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E4E0',
      }}>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1A18' }}>
            🏥 {specialistType ? `Nearby ${specialistType}` : 'Nearby Doctors'}
          </Text>
          {location && (
            <Text style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>
               {places.length} places found in 5 km radius
            </Text>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: activeFilter === f ? '#534AB7' : 'white',
                borderWidth: 1,
                borderColor: activeFilter === f ? '#534AB7' : '#E5E4E0',
              }}
            >
              <Text style={{ fontSize: 13, color: activeFilter === f ? 'white' : '#888780', fontWeight: activeFilter === f ? '600' : '400' }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#534AB7" />}
      >

        {/* Fallback — Overpass down, open Google Maps */}
        {fallback && (
          <View style={{ backgroundColor: '#FAEEDA', borderRadius: 16, padding: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#633806', marginBottom: 12, lineHeight: 20 }}>
              Local search abhi available nahi hai. Google Maps pe directly search karein:
            </Text>
            <TouchableOpacity
              onPress={openMapsSearch}
              style={{ backgroundColor: '#BA7517', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <MapPin size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Google Maps pe Dhundhein ↗
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!fallback && filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <MapPin size={48} color="#D3D1C7" />
            <Text style={{ fontSize: 16, color: '#888780', marginTop: 12, textAlign: 'center' }}>
              Is area mein koi {activeFilter !== 'All' ? activeFilter : 'healthcare center'} nahi mila
            </Text>
            <TouchableOpacity onPress={openMapsSearch} style={{ marginTop: 16, backgroundColor: '#534AB7', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Google Maps pe Dhundhein ↗</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Places list */}
        {filtered.map((place, index) => {
          const typeColor = getTypeColor(place.type);
          return (
            <View
              key={place.id || index}
              style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#E5E4E0' }}
            >
              {/* Name + type badge */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A18', flex: 1, marginRight: 8, lineHeight: 21 }}>
                  {place.name}
                </Text>
                <View style={{ backgroundColor: typeColor.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, color: typeColor.text, fontWeight: '500' }}>{place.type}</Text>
                </View>
              </View>

              {/* Distance */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <MapPin size={13} color="#888780" />
                <Text style={{ fontSize: 13, color: '#888780' }}>{place.distanceText} door</Text>
              </View>

              {/* Address */}
              {place.address !== 'Address not available' && (
                <Text style={{ fontSize: 12, color: '#B4B2A9', marginBottom: 8, lineHeight: 18 }}>
                  {place.address}
                </Text>
              )}

              {/* Phone + Maps buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {place.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${place.phone}`)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E1F5EE', paddingVertical: 10, borderRadius: 10 }}
                  >
                    <Phone size={15} color="#0F6E56" />
                    <Text style={{ fontSize: 13, color: '#0F6E56', fontWeight: '500' }}>Call</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => openMaps(place)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EEEDFE', paddingVertical: 10, borderRadius: 10 }}
                >
                  <Navigation size={15} color="#534AB7" />
                  <Text style={{ fontSize: 13, color: '#534AB7', fontWeight: '500' }}>Google Maps ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}