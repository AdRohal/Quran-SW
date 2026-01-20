import { Play, Sunrise, Sun, CloudSun, Sunset, Moon, MapPin, CalendarDays, ChevronRight, Bell } from 'lucide-react'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { computeNextPrayer, getCurrentPosition, getPrayerTimesByCoords, HijriDate } from '../lib/prayerTimes'
import { getDailyVerse, getUpcomingHolidays, QuranVerse, getAyahAudio, isPrayerTime, getNextPrayerTime, getAdhanAudio } from '../lib/quran'

// Hijri month names in Arabic
const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الثانية',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
]

// Format Hijri date in Arabic style
const formatHijriDateArabic = (hijri: HijriDate) => {
  return `${hijri.hy} ${HIJRI_MONTHS[hijri.hm - 1]} ${hijri.hd}`
}

// Convert Hijri dates to Gregorian for display (approximation)
const hijriToGregorian = (hijriDay: number, hijriMonth: number, hijriYear: number) => {
  const jd = Math.ceil(((11 * hijriYear + 3) / 30) + hijriMonth * 29.5001 + hijriDay + 1948439.5)
  const l = jd + 68569
  const n = Math.floor((4 * l) / 146097)
  const l2 = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l2 + 1)) / 1461001)
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l3) / 2447)
  const d = l3 - Math.floor((2447 * j) / 80)
  const l4 = Math.floor(j / 11)
  const m = j + 2 - 12 * l4
  const y = 100 * (n - 49) + i + l4
  
  return new Date(y, m - 1, d)
}

// Get upcoming holidays dynamically based on current Hijri date
const getDynamicUpcomingHolidays = (currentHijri: HijriDate) => {
  if (currentHijri.hy === 0) return []
  
  const upcoming = getUpcomingHolidays(currentHijri.hm, currentHijri.hd, 4)
  
  return upcoming.map(h => {
    const gregorianDate = hijriToGregorian(h.hijri.day, h.hijri.month, currentHijri.hy)
    return {
      name: h.name,
      arabicName: h.arabicName,
      date: gregorianDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric' 
      }).toUpperCase(),
      type: h.type
    }
  })
}

export function Home() {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [timings, setTimings] = useState<Record<string, string> | null>(null)
  const [timezone, setTimezone] = useState('')
  const [dateReadable, setDateReadable] = useState('')
  const [next, setNext] = useState<ReturnType<typeof computeNextPrayer> | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentHijri, setCurrentHijri] = useState({ hy: 0, hm: 0, hd: 0 })
  const [currentGregorian, setCurrentGregorian] = useState(new Date())
  const [islamicHolidays, setIslamicHolidays] = useState<any[]>([])
  const [dailyVerse, setDailyVerse] = useState<QuranVerse | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null)
  const [adhanPlaying, setAdhanPlaying] = useState(false)
  const adhanAudioRef = useRef<HTMLAudioElement>(null)
  const notifiedPrayersRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        let c = { lat: 21.4225, lon: 39.8262 } // Default to Makkah
        
        // Try to get user position with timeout
        try {
          const pos = await Promise.race([
            getCurrentPosition(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Geolocation timeout')), 5000)
            )
          ])
          c = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        } catch (geoErr) {
          // Use default coordinates if geolocation fails or times out
          console.warn('Using default coordinates:', geoErr)
        }
        
        setCoords(c)
        const res = await getPrayerTimesByCoords(c.lat, c.lon, { method: 3, school: 0 })
        setTimings(res.timings)
        setTimezone(res.timezone)
        setDateReadable(res.dateReadable)
        setNext(computeNextPrayer(res.timings))
        
        // Set Hijri date from API response
        if (res.hijri) {
          setCurrentHijri(res.hijri)
          setIslamicHolidays(getDynamicUpcomingHolidays(res.hijri))
        }
        
        // Fetch daily verse
        const verse = await getDailyVerse()
        setDailyVerse(verse)

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          setNotificationPermission(permission)
        } else {
          setNotificationPermission(Notification.permission as NotificationPermission)
        }
      } catch (e: any) {
        console.warn(e?.message ?? e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Monitor prayer times and show Adhan notification
  useEffect(() => {
    if (!timings || !('Notification' in window)) return

    const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    const checkInterval = setInterval(() => {
      prayerOrder.forEach(prayer => {
        const prayerTime = timings[prayer]
        if (!prayerTime || notifiedPrayersRef.current.has(prayer)) return

        // Check if it's prayer time (within 2 minutes)
        const now = new Date()
        const [hours, minutes] = prayerTime.split(':').map(Number)
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const prayerMinutes = hours * 60 + minutes

        const timeDifference = Math.abs(currentMinutes - prayerMinutes)

        if (timeDifference < 2) {
          // Play Adhan sound
          if (adhanAudioRef.current) {
            const sourceElement = adhanAudioRef.current.querySelector('source')
            if (sourceElement) {
              sourceElement.src = getAdhanAudio()
              sourceElement.type = 'audio/mpeg'
            }
            adhanAudioRef.current.load()
            adhanAudioRef.current.play().catch(err => console.warn('Could not play Adhan:', err))
            setAdhanPlaying(true)
          }

          // Show notification
          if (Notification.permission === 'granted') {
            new Notification(`⏰ ${prayer} Prayer Time`, {
              body: `It's time for ${prayer} prayer at ${prayerTime}`,
              icon: '🕌',
              tag: prayer,
              requireInteraction: false,
            })
          }

          // Mark prayer as notified
          notifiedPrayersRef.current.add(prayer)

          // Remove from notified set after 5 minutes (for next day)
          setTimeout(() => {
            notifiedPrayersRef.current.delete(prayer)
          }, 5 * 60 * 1000)
        }
      })
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkInterval)
  }, [timings])

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

  const handlePlayAudio = async () => {
    if (!dailyVerse || audioLoading) return

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
      return
    }

    try {
      setAudioLoading(true)
      
      console.log(`🎵 Playing audio for Surah ${dailyVerse.surahNumber} Ayah ${dailyVerse.ayahNumber}`)
      console.log(`📍 Absolute ayah number: ${dailyVerse.absoluteAyahNumber}`)
      
      if (audioRef.current) {
        // Use the absolute ayah number which is the correct position in Quran
        const sourceElement = audioRef.current.querySelector('source')
        if (sourceElement) {
          sourceElement.src = `/api/quran/audio/${dailyVerse.absoluteAyahNumber}`
          sourceElement.type = 'audio/mpeg'
        }
        
        // Load the audio
        audioRef.current.load()
        
        // Try to play
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio playing...')
              setIsPlayingAudio(true)
            })
            .catch((error) => {
              console.error('❌ Playback error:', error)
              setIsPlayingAudio(false)
            })
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    } finally {
      setAudioLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full px-6 md:px-12 lg:px-16 pb-10">
      {/* Hidden audio elements */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        crossOrigin="anonymous"
        controls={false}
      >
        <source type="audio/mpeg" />
      </audio>
      
      {/* Adhan audio element */}
      <audio
        ref={adhanAudioRef}
        onEnded={() => setAdhanPlaying(false)}
        crossOrigin="anonymous"
        controls={false}
      >
        <source type="audio/mpeg" />
      </audio>

      {/* Notification Permission Badge */}
      {notificationPermission === 'denied' && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-2">
          <Bell size={16} className="text-red-600 line-through" />
          <span>Enable notifications in browser settings for prayer alerts</span>
        </div>
      )}

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
          <div className="mb-6">
            <p className="text-white/80 text-sm mb-2">
              "Verily, in the remembrance of Allah do hearts find rest." (13:28)
            </p>
            <p className="text-white/80 text-2xl text-right" style={{ fontFamily: "var(--font-arabic)" }}>
              "إن بذكر الله تطمئن القلوب" (13:28)
            </p>
          </div>
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
              className={`flex-1 text-center py-6 px-4 rounded-2xl transition-all ${
                prayer.active
                  ? 'bg-teal-700 border-4 border-teal-700 shadow-lg'
                  : 'bg-white border-2 border-gray-200 shadow-sm'
              }`}
            >
              <IconComponent 
                size={24} 
                className={`mx-auto mb-3 ${
                  prayer.active ? 'text-white' : 'text-teal-700'
                }`}
                strokeWidth={1.5}
              />
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${
                prayer.active ? 'text-white' : 'text-teal-700'
              }`}>{prayer.name}</p>
              <p className={`text-3xl font-serif font-bold ${
                prayer.active ? 'text-white' : 'text-teal-700'
              }`}>{loading ? '—' : prayer.time}</p>
            </div>
          )
        })}
      </div>

      {/* Islamic Calendar & Holidays */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-gray-800">Upcoming Islamic Holidays</h2>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-teal-700 text-sm font-semibold hover:underline flex items-center gap-1 transition-colors hover:text-teal-800"
            >
              Full Calendar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {islamicHolidays.slice(0, 4).map((holiday) => (
              <div key={holiday.name} className="group hover:shadow-lg transition-all cursor-pointer bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold bg-teal-700/10 text-teal-700">
                    <CalendarDays className="w-5 h-5 mb-0.5" />
                    <span>{currentGregorian.getFullYear()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-800 group-hover:text-teal-700 transition-colors">{holiday.name}</h4>
                      {holiday.type === 'Major' && <div className="w-1.5 h-1.5 rounded-full bg-teal-700 animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{holiday.date}</p>
                    <p className="text-teal-700/70 text-sm" style={{ fontFamily: "var(--font-arabic)" }}>{holiday.arabicName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-serif font-bold text-gray-800">Current Date</h2>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-2xl shadow-sm h-full flex flex-col justify-center text-center p-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-teal-700/70 uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-arabic)" }}>
                {currentHijri.hy > 0 ? formatHijriDateArabic(currentHijri) : 'جاري التحميل...'}
              </p>
              <h3 className="text-3xl font-serif font-bold text-gray-800 mb-1">
                {currentGregorian.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-gray-600">
                {currentGregorian.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
              </p>
              <div className="mt-6 p-3 bg-white rounded-2xl border border-teal-200 text-xs text-teal-700 font-medium shadow-sm">
                Al-Isra' wal-Mi'raj
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Verse & Memorization */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Verse */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Daily Verse</h2>
            <button 
              onClick={handlePlayAudio}
              disabled={audioLoading || !dailyVerse}
              className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-teal-800 disabled:text-gray-400 transition-colors"
            >
              <Play size={14} className="fill-primary" />
              {audioLoading ? 'Loading...' : isPlayingAudio ? 'Stop' : 'Listen'}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-2xl text-primary mb-4 leading-loose" style={{ fontFamily: "var(--font-arabic)" }}>
              {dailyVerse?.text || 'جاري التحميل...'}
            </p>
            <p className="text-gray-600 italic text-sm mb-3">
              "{dailyVerse?.translation || 'Loading translation...'}"
            </p>
            <p className="text-xs text-gray-400">
              {dailyVerse ? `Surah ${dailyVerse.surahName} [${dailyVerse.surahNumber}:${dailyVerse.ayahNumber}]` : 'Loading...'} • {dateReadable || '—'}
            </p>
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
