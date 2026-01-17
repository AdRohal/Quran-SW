import { Play, Sunrise, Sun, CloudSun, Sunset, Moon, MapPin } from 'lucide-react'
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
      { name: 'FAJR', time: t['Fajr'] ?? '--:--', icon: Sunrise },
      { name: 'DHUHR', time: t['Dhuhr'] ?? '--:--', icon: Sun },
      { name: 'ASR', time: t['Asr'] ?? '--:--', icon: CloudSun },
      { name: 'MAGHRIB', time: t['Maghrib'] ?? '--:--', icon: Sunset },
      { name: 'ISHA', time: t['Isha'] ?? '--:--', icon: Moon },
    ].map((p) => ({ ...p, active: next?.name?.toUpperCase() === p.name }))
  }, [timings, next])

  return (
    <div className="space-y-6 w-full max-w-full px-4 md:px-6 lg:px-10 pb-10">
      {/* Hero Section */}
      <div className="relative h-[420px] bg-primary rounded-3xl overflow-hidden w-full shadow-xl">
        {/* Mosque Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/src/public/peaceful_mosque_courtyard_at_sunset.png)',
            backgroundPosition: 'center center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center p-8">
          <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md text-white text-sm px-4 py-3 rounded-full mb-4 w-fit border border-white/10">
            <MapPin size={18} className="text-white flex-shrink-0" />
            <span className="font-medium">{timezone ? timezone.split('/').join(', ') : 'Location'}</span>
          </div>
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
      <div className="flex gap-4">
        {prayers.map((prayer) => {
          const IconComponent = prayer.icon
          return (
            <div
              key={prayer.name}
              className={`flex-1 text-center py-8 px-4 rounded-3xl transition-all ${
                prayer.active
                  ? 'bg-primary text-white border-4 border-primary shadow-lg'
                  : 'bg-white border-2 border-gray-200 shadow-sm'
              }`}
            >
              <IconComponent 
                size={32} 
                className={`mx-auto mb-4 ${
                  prayer.active ? 'text-white' : 'text-gray-400'
                }`}
                strokeWidth={1.5}
              />
              <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${
                prayer.active ? 'text-white/95' : 'text-gray-500'
              }`}>{prayer.name}</p>
              <p className={`text-3xl font-bold ${
                prayer.active ? 'text-white' : 'text-gray-900'
              }`}>{loading ? '—' : prayer.time}</p>
            </div>
          )
        })}
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
