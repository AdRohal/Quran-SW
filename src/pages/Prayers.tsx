import { useEffect, useMemo, useState } from 'react';
import { Cloud, Sun, CloudRain, Moon, Settings, Navigation, MapPin, Calendar, Bell, Sunrise, Sunset } from 'lucide-react';
import {
  METHOD_OPTIONS,
  SCHOOL_OPTIONS,
  computeNextPrayer,
  getCurrentPosition,
  getPrayerTimesByCoords,
} from '../lib/prayerTimes';
import mosqueImage from '../public/peaceful_mosque_courtyard_at_sunset.png';

type MethodValue = (typeof METHOD_OPTIONS)[number]['value'];
type SchoolValue = (typeof SCHOOL_OPTIONS)[number]['value'];

function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function Prayers() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [method, setMethod] = useState<MethodValue>(3);
  const [school, setSchool] = useState<SchoolValue>(0);
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [timezone, setTimezone] = useState('');
  const [dateReadable, setDateReadable] = useState('');
  const [next, setNext] = useState<ReturnType<typeof computeNextPrayer> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Try to get geolocation on mount
    (async () => {
      try {
        const pos = await getCurrentPosition();
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      } catch (e: any) {
        setError(e?.message ?? 'Failed to get location');
      }
    })();
  }, []);

  const fetchTimes = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPrayerTimesByCoords(lat, lon, { method, school });
      setTimings(res.timings);
      setTimezone(res.timezone);
      setDateReadable(res.dateReadable);
      setNext(computeNextPrayer(res.timings));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch prayer times');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coords) {
      fetchTimes(coords.lat, coords.lon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, method, school]);

  const sunrise = timings?.['Sunrise'] ?? '--:--';
  const sunset = timings?.['Sunset'] ?? '--:--';

  const nextCountdown = useMemo(() => {
    if (!next) return null;
    const [hh, mm] = next.time.split(':').map((x) => parseInt(x, 10));
    const tgt = new Date();
    tgt.setHours(hh, mm, 0, 0);
    const ms = tgt.getTime() - Date.now();
    return formatCountdown(ms);
  }, [next]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 md:px-12 lg:px-16 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-teal-800">Prayer Times</h1>
            <p className="text-teal-600 text-sm mt-1">Accurate times for your location</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border-2 border-gray-400 text-gray-700 px-5 py-2 rounded-full font-semibold hover:border-gray-500 transition">
              <Navigation size={20} />
              Qibla Finder
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full border-2 border-gray-400 text-gray-600 hover:border-gray-500 transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-xl p-6 shadow-md mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Method:</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                  value={method}
                  onChange={(e) => setMethod(Number(e.target.value) as MethodValue)}
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School:</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                  value={school}
                  onChange={(e) => setSchool(Number(e.target.value) as SchoolValue)}
                >
                  {SCHOOL_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                className="bg-teal-700 hover:bg-teal-900 text-white px-4 py-2 rounded-lg font-semibold transition"
                onClick={() => {
                  if (coords) fetchTimes(coords.lat, coords.lon);
                }}
              >
                Refresh
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition"
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prayer Card */}
            <div 
              className="bg-cover bg-center text-white rounded-2xl overflow-hidden relative shadow-xl"
              style={{
                backgroundImage: `url(${mosqueImage})`,
                minHeight: '240px'
              }}
            >
              {/* Dark teal overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1e6b5e]/90 via-[#2a7d6d]/85 to-[#3a8d7d]/70" />
              
              {/* Fluid wave shape for right side */}
              <div className="absolute right-0 top-0 bottom-0 w-[320px]">
                <svg 
                  viewBox="0 0 320 240" 
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                >
                  <path 
                    d="M60,0 Q20,60 40,120 Q60,180 30,240 L320,240 L320,0 Z" 
                    fill="rgba(255,255,255,0.75)"
                  />
                </svg>
                
                {/* Content inside white area */}
                <div className="relative z-10 p-5 pl-20 pt-6 h-full">
                  <div className="flex items-center gap-2 mb-5">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="font-semibold text-gray-800">{dateReadable || 'Jan 18, 2026'}</span>
                    <span className="text-gray-400 text-sm">Rajab 27, 1447</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sunrise</span>
                      <span className="text-teal-600 font-bold text-xl">{sunrise}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sunset</span>
                      <span className="text-teal-600 font-bold text-xl">{sunset}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 p-6 h-full">
                {/* Left side - Prayer info */}
                <div className="max-w-[55%]">
                  <p className="text-sm flex items-center gap-2 mb-4">
                    <MapPin size={16} />
                    Makkah, Saudi Arabia
                  </p>
                  <p className="text-5xl font-bold tracking-tight">{next?.time ?? '--:--'}</p>
                  <p className="text-lg font-medium mt-2">{next ? `${next.name} Prayer is Next` : 'Loading...'}</p>
                  <p className="inline-block text-sm bg-white/20 px-4 py-1.5 rounded-full mt-3">{next ? `-${nextCountdown} until ${next.name}` : loading ? 'Fetching...' : error ? error : '—'}</p>
                </div>
              </div>
            </div>

            {/* Prayer Cards */}
            <div className="space-y-3">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
                const time = timings?.[name] ?? '--:--';
                const isNext = next?.name === name;
                const getIcon = (prayerName: string) => {
                  const iconClass = 'w-5 h-5 text-teal-700';
                  switch (prayerName) {
                    case 'Fajr': return <Sunrise className={iconClass} />;
                    case 'Dhuhr': return <Sun className={iconClass} />;
                    case 'Asr': return <Sun className={iconClass} />;
                    case 'Maghrib': return <Sunset className={iconClass} />;
                    case 'Isha': return <Moon className={iconClass} />;
                    default: return null;
                  }
                };

                return (
                  <div
                    key={name}
                    className="flex items-center justify-between px-5 py-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-50">
                        {getIcon(name)}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg text-gray-800">{name}</p>
                        {isNext && (
                          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
                            Next Prayer
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-xl font-bold text-gray-700">{time}</p>
                      <Bell className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {!coords && (
              <div className="bg-white rounded-xl p-6 shadow-md space-y-3">
                <p className="text-sm text-gray-700">Enable location access in your browser to auto-detect your position, or enter coordinates below.</p>
                <ManualCoordsForm onSubmit={(lat, lon) => setCoords({ lat, lon })} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prayer Tracker */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Prayer Tracker</h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Weekly Streak</p>
                <p className="text-2xl font-bold text-teal-700">5 Days</p>
              </div>

              <div className="flex justify-between items-center gap-2 mb-6">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div
                    key={day + idx}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                      idx < 5 ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500">
                <p>Keep your streak going! Pray on time daily.</p>
              </div>
            </div>

            {/* Hadith of the Day */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-md border border-yellow-200">
              <h2 className="text-lg font-bold text-yellow-900 mb-3">Hadith of the Day</h2>
              <p className="text-sm italic text-yellow-800 leading-relaxed">
                "The five daily prayers and Friday prayer until Friday prayer are expiations for what is between them."
              </p>
              <p className="text-xs text-yellow-700 mt-3 font-semibold">— Sahih Muslim</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualCoordsForm({ onSubmit }: { onSubmit: (lat: number, lon: number) => void }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  return (
    <form
      className="flex flex-col md:flex-row gap-3 items-center"
      onSubmit={(e) => {
        e.preventDefault();
        const latNum = Number(lat);
        const lonNum = Number(lon);
        if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return;
        onSubmit(latNum, lonNum);
      }}
    >
      <input
        className="border border-gray-300 rounded-lg p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-teal-700"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-teal-700"
        placeholder="Longitude"
        value={lon}
        onChange={(e) => setLon(e.target.value)}
      />
      <button className="bg-teal-700 hover:bg-teal-900 text-white px-4 py-2 rounded-lg font-semibold transition" type="submit">Set Location</button>
    </form>
  );
}
