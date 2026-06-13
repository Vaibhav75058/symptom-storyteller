// Geoapify API Key
const GEOAPIFY_API_KEY = '2c30439a334248c693220683c0ecf8af';

// Calculate distance between two coordinates (km) - Fallback if Geoapify doesn't provide it
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

// Main function — fetch nearby healthcare places using Geoapify
export const fetchNearbyDoctors = async (latitude, longitude, specialistType = null, radiusKm = 5) => {
  try {
    const radiusMeters = radiusKm * 1000;
    
    // Geoapify Places API URL
    // To get MAXIMUM results, we use the broad 'healthcare' category, radius = 50,000m (50km), and limit = 100
    const url = `https://api.geoapify.com/v2/places?categories=healthcare&filter=circle:${longitude},${latitude},50000&bias=proximity:${longitude},${latitude}&limit=100&apiKey=${GEOAPIFY_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geoapify API failed with status ${response.status}`);
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length === 0) {
      return [];
    }

    // Parse results
    const places = features.map(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates; // [lon, lat]
      
      const lat = coords[1];
      const lng = coords[0];
      
      if (!lat || !lng) return null;

      const name = props.name || props.address_line1 || 'Healthcare Center';
      
      // Determine type based on categories
      let type = 'Doctor';
      if (props.categories) {
        if (props.categories.includes('healthcare.hospital')) type = 'Hospital';
        else if (props.categories.includes('healthcare.clinic')) type = 'Clinic';
      }

      // Geoapify gives distance in meters, convert to km
      const distanceKm = props.distance 
        ? (props.distance / 1000).toFixed(1) 
        : getDistance(latitude, longitude, lat, lng);

      // Address formatting
      const address = props.address_line2 || props.formatted || 'Address not available';
      
      // Phone
      const phone = props.contact?.phone || null;

      return {
        id: props.place_id || Math.random().toString(),
        name,
        type,
        distance: parseFloat(distanceKm),
        distanceText: `${distanceKm} km`,
        lat,
        lng,
        address,
        phone,
        openingHours: props.opening_hours || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance); // nearest first

    return places;

  } catch (error) {
    console.error('Geoapify API Error:', error.message);

    // Fallback — Google Maps search
    return { fallback: true, specialistType };
  }
};

// Open Google Maps with directions to a specific place
export const openInGoogleMaps = (lat, lng, name) => {
  const encodedName = encodeURIComponent(name);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodedName}`;
  return url;
};

// Open Google Maps search (when no specific coordinates)
export const openGoogleMapsSearch = (specialistType, userLat, userLng) => {
  const query = encodeURIComponent(`${specialistType || 'doctor hospital'} near me`);
  const url = `https://www.google.com/maps/search/${query}/@${userLat},${userLng},14z`;
  return url;
};