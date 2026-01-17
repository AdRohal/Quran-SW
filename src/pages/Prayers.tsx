import { useEffect, useMemo, useState } from 'react';
import {
  METHOD_OPTIONS,
  SCHOOL_OPTIONS,
  computeNextPrayer,
  getCurrentPosition,
  getPrayerTimesByCoords,
} from '../lib/prayerTimes';

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
    <div className="space-y-6 pb-20 md:pb-0 mx-4 md:mx-0 px-2 md:px-4 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Prayer Times</h1>

      <div className="bg-white rounded-xl p-4 shadow-md flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Method:</span>
          <select
            className="border rounded-md p-2 text-sm"
            value={method}
            onChange={(e) => setMethod(Number(e.target.value) as MethodValue)}
          >
            {METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">School:</span>
          <select
            className="border rounded-md p-2 text-sm"
            value={school}
            onChange={(e) => setSchool(Number(e.target.value) as SchoolValue)}
          >
            {SCHOOL_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            className="bg-primary text-white text-sm px-3 py-2 rounded-md"
            onClick={() => {
              if (coords) fetchTimes(coords.lat, coords.lon);
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary via-primary-dark to-gray-900 text-white rounded-2xl p-8 shadow-2xl">
        <p className="text-sm opacity-90 mb-2">
          📍 {coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Location unavailable'}
        </p>
        <p className="text-xs opacity-75 mb-4">{dateReadable || '—'} • {timezone || '—'}</p>

        <p className="text-7xl font-bold mb-2">{next?.time ?? '--:--'}</p>
        <p className="text-2xl font-semibold mb-2">{next ? `${next.name} is Next` : 'Loading...'}</p>
        <p className="text-sm opacity-75">{next ? `${nextCountdown} until ${next.name}` : loading ? 'Fetching...' : error ? error : '—'}</p>

        <div className="mt-6 pt-6 border-t border-white border-opacity-20 flex justify-between">
          <div>
            <p className="text-sm opacity-75">Sunrise</p>
            <p className="text-xl font-bold">{sunrise}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Sunset</p>
            <p className="text-xl font-bold">{sunset}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
          const time = timings?.[name] ?? '--:--';
          const isNext = next?.name === name;
          const icon = name === 'Fajr' ? '🌅' : name === 'Dhuhr' ? '☀️' : name === 'Asr' ? '🌤️' : name === 'Maghrib' ? '🌅' : '🌙';
          return (
            <div
              key={name}
              className={`flex items-center justify-between p-4 rounded-xl transition border ${
                isNext ? 'bg-primary-50 border-primary shadow-md' : 'bg-white border-gray-100 hover:border-primary'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-800">{name}</p>
                  {isNext && <p className="text-xs text-primary font-bold">NEXT PRAYER</p>}
                </div>
              </div>
              <p className={`text-2xl font-bold ${isNext ? 'text-primary' : 'text-gray-800'}`}>{time}</p>
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
        className="border rounded-md p-2 flex-1"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
      />
      <input
        className="border rounded-md p-2 flex-1"
        placeholder="Longitude"
        value={lon}
        onChange={(e) => setLon(e.target.value)}
      />
      <button className="bg-primary text-white px-4 py-2 rounded-md" type="submit">Set Location</button>
    </form>
  );
}
