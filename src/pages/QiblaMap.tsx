import { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MECCA_LAT = 21.4225;
const MECCA_LON = 39.8262;

interface Location {
  lat: number;
  lon: number;
}

// Custom marker icons
const createUserIcon = () => {
  return L.divIcon({
    html: `<div style="background-color: #20c997; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <div style="color: white; font-size: 12px;">📍</div>
    </div>`,
    iconSize: [24, 24],
    className: 'custom-marker',
  });
};

const createMeccaIcon = () => {
  return L.divIcon({
    html: `<div style="background-color: #0d766e; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <div style="color: white; font-size: 14px;">🕋</div>
    </div>`,
    iconSize: [28, 28],
    className: 'custom-marker',
  });
};

// Fit bounds component
function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      // Account for navigation sidebar (288px) and controls
      map.fitBounds(bounds, { padding: [100, 350] });
    }
  }, [bounds, map]);
  return null;
}

export function QiblaMap() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate Qibla direction
  const calculateQibla = (userLat: number, userLon: number): number => {
    const lat1 = (userLat * Math.PI) / 180;
    const lat2 = (MECCA_LAT * Math.PI) / 180;
    const dLon = ((MECCA_LON - userLon) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user location
  useEffect(() => {
    setLoading(true);
    setError(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLoc = { lat: latitude, lon: longitude };
          setUserLocation(userLoc);
          
          const direction = calculateQibla(latitude, longitude);
          setQiblaDirection(direction);
          
          const dist = calculateDistance(latitude, longitude, MECCA_LAT, MECCA_LON);
          setDistance(dist);
          
          setLoading(false);
        },
        (err) => {
          setError('Unable to get your location. Please enable location services.');
          setLoading(false);
          console.error(err);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  // Calculate bounds for map
  const bounds = useMemo(() => {
    if (!userLocation) return null;
    return L.latLngBounds([
      [userLocation.lat, userLocation.lon],
      [MECCA_LAT, MECCA_LON]
    ]);
  }, [userLocation]);

  return (
    <div className="w-full h-screen flex flex-col">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 text-teal-700 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Getting your location...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && userLocation && (
        <div className="flex-1">
          <MapContainer
            center={[(userLocation.lat + MECCA_LAT) / 2, (userLocation.lon + MECCA_LON) / 2]}
            zoom={3}
            minZoom={3.5}
            maxZoom={18}
            style={{ height: '100%', width: '100%' }}
            maxBounds={[[-85, -180], [85, 180]]}
            maxBoundsViscosity={1.0}
            draggable={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              noWrap={true}
            />

            {/* Polyline connecting user to Mecca */}
            <Polyline
              positions={[[userLocation.lat, userLocation.lon], [MECCA_LAT, MECCA_LON]]}
              color="#0d766e"
              weight={3}
              opacity={0.8}
              dashArray="10, 5"
            />

            {/* User Location Marker */}
            <Marker position={[userLocation.lat, userLocation.lon]} icon={createUserIcon()}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-teal-700">Your Location</p>
                  <p className="text-sm">{userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°</p>
                </div>
              </Popup>
            </Marker>

            {/* Mecca Location Marker */}
            <Marker position={[MECCA_LAT, MECCA_LON]} icon={createMeccaIcon()}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-teal-700">Mecca - Holy Ka'bah</p>
                  <p className="text-sm">{MECCA_LAT.toFixed(4)}°, {MECCA_LON.toFixed(4)}°</p>
                </div>
              </Popup>
            </Marker>

            {/* Fit bounds */}
            <FitBounds bounds={bounds} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}

// Helper function to get direction label
function getDirectionLabel(degrees: number): string {
  const directions = ['North', 'NNE', 'NE', 'ENE', 'East', 'ESE', 'SE', 'SSE', 'South', 'SSW', 'SW', 'WSW', 'West', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}
