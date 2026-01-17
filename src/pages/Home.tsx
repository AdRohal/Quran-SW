import { Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { computeNextPrayer, getCurrentPosition, getPrayerTimesByCoords } from '../lib/prayerTimes'

export function Home() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [timings, setTimings] = useState<Record<string, string> | null>(null)
  const [timezone, setTimezone] = useState('')
  const [dateReadable, setDateReadable] = useState('')
  const [next, setNext] = useState<ReturnType<typeof computeNextPrayer> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const pos = await getCurrentPosition()
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setCoords(c)
        setLoading(true)
        const res = await getPrayerTimesByCoords(c.lat, c.lon, { method: 3, school: 0 })
        setTimings(res.timings)
        setTimezone(res.timezone)
        setDateReadable(res.dateReadable)
        setNext(computeNextPrayer(res.timings))
      } catch (e: any) {
        // Optionally surface errors in UI; for now log.
        console.warn(e?.message ?? e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const prayers = useMemo(() => {
    const t = timings || {}
    return [
      { name: 'FAJR', time: t['Fajr'] ?? '--:--', icon: '🌅' },
      { name: 'DHUHR', time: t['Dhuhr'] ?? '--:--', icon: '☀️' },
      { name: 'ASR', time: t['Asr'] ?? '--:--', icon: '🌤️' },
      { name: 'MAGHRIB', time: t['Maghrib'] ?? '--:--', icon: '🌇' },
      { name: 'ISHA', time: t['Isha'] ?? '--:--', icon: '🌙' },
    ].map((p) => ({ ...p, active: next?.name?.toUpperCase() === p.name }))
  }, [timings, next])

  return (
    <div className="space-y-6 w-full max-w-full px-4 md:px-6 lg:px-10 pb-10">
      {/* Hero Section */}
      <div className="relative h-72 bg-primary rounded-3xl overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary-dark" />
        <div className="relative z-10 h-full flex flex-col justify-center p-8">
          <p className="text-white/80 text-sm mb-2">
            📍 {coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Location'} • {timezone || '—'}
          </p>
          <h1 className="text-4xl font-bold text-white mb-3">Find Peace in Remembrance</h1>
          <p className="text-white/80 text-sm mb-6">
            "Verily, in the remembrance of Allah do hearts find rest." (13:28)
          </p>
          <div className="flex gap-3">
            <button className="bg-white text-primary font-medium px-6 py-2.5 rounded-full text-sm hover:bg-gray-100 transition">
              Continue Reading
            </button>
            <button className="bg-gray-800/50 text-white font-medium px-6 py-2.5 rounded-full text-sm hover:bg-gray-800/70 transition">
              Daily Adkar
            </button>
          </div>
        </div>
      </div>

      {/* Prayer Times */}
      <div className="flex gap-3">
        {prayers.map((prayer) => (
          <div
            key={prayer.name}
            className={`flex-1 text-center py-4 px-2 rounded-2xl transition ${
              prayer.active
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-100'
            }`}
          >
            <p className="text-2xl mb-1">{prayer.icon}</p>
            <p className={`text-[10px] uppercase tracking-wider font-medium ${
              prayer.active ? 'text-white/80' : 'text-gray-400'
            }`}>{prayer.name}</p>
            <p className={`text-lg font-bold mt-1 ${
              prayer.active ? 'text-white' : 'text-gray-800'
            }`}>{loading ? '—' : prayer.time}</p>
          </div>
        ))}
      </div>

      {/* Daily Verse & Memorization */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Verse */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Daily Verse</h2>
            <button className="flex items-center gap-1.5 text-primary text-sm font-medium">
              <Play size={14} className="fill-primary" />
              Listen
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-2xl text-primary font-arabic mb-4 leading-loose">
              فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
            </p>
            <p className="text-gray-600 italic text-sm mb-3">
              "For indeed, with hardship [will be] ease."
            </p>
            <p className="text-xs text-gray-400">Surah Ash-Sharh [94:5] • {dateReadable || '—'}</p>
          </div>
        </div>

        {/* Memorization */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Memorization</h2>
            <button className="text-primary text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Surah Al-Mulk', subtitle: 'The Sovereignty', number: 67, ayahs: 30, progress: 85 },
              { name: 'Surah Ya-Sin', subtitle: 'Ya Sin', number: 36, ayahs: 83, progress: 10 },
            ].map((surah) => (
              <div key={surah.number} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {surah.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 text-sm">{surah.name}</p>
                      <p className="text-primary font-bold text-sm">{surah.progress}%</p>
                    </div>
                    <p className="text-xs text-gray-400">{surah.subtitle} • {surah.ayahs} Ayahs</p>
                    <div className="bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${surah.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
