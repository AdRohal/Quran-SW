import { useState, useEffect, useMemo } from 'react';
import { Loader } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            center={[(userLocation.lat + MECCA_LAT) / 2, (userLocation.lon + MECCA_LON) / 2] as [number, number]}
            zoom={3}
            minZoom={3.5}
            maxZoom={18}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              crossOrigin=""
            />

            {/* Polyline connecting user to Mecca */}
            <Polyline
              positions={[[userLocation.lat, userLocation.lon], [MECCA_LAT, MECCA_LON]]}
              pathOptions={{ color: '#0d766e', weight: 3, opacity: 0.8, dashArray: '10, 5' }}
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

