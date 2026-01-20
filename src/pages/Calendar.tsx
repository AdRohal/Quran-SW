import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ISLAMIC_HOLIDAYS_DATA } from '../lib/quran'

interface HijriDay {
  date: string
  islamic: string
  gregorian: string
  dayOfWeek: string
}

// Convert numbers to Arabic words for dates
const numberToArabicWord = (num: number): string => {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
  const teens = ['عشرة', 'احدى عشرة', 'اثنا عشرة', 'ثلاثة عشرة', 'أربعة عشرة', 'خمسة عشرة', 'ستة عشرة', 'سبعة عشرة', 'ثمانية عشرة', 'تسعة عشرة']
  
  if (num === 0) return 'صفر'
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  
  const ten = Math.floor(num / 10)
  const one = num % 10
  
  if (one === 0) return tens[ten]
  return `${ones[one]} و${tens[ten]}`
}

const ISLAMIC_HOLIDAYS_FULL = ISLAMIC_HOLIDAYS_DATA.map(h => ({
  name: h.name,
  arabicName: h.arabicName,
  month: h.hijri.month,
  day: h.hijri.day,
  type: h.type,
}))

export function Calendar() {
  const [currentHijri, setCurrentHijri] = useState({ year: 1447, month: 7 })
  const [calendarDays, setCalendarDays] = useState<HijriDay[]>([])
  const [loading, setLoading] = useState(true)
  const [today, setToday] = useState<{ year: number; month: number; day: number } | null>(null)

  // Get current Hijri date
  useEffect(() => {
    const fetchTodayDate = async () => {
      try {
        const today = new Date()
        const day = String(today.getDate()).padStart(2, '0')
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const year = today.getFullYear()
        // Use dash format for Aladhan API (DD-MM-YYYY)
        const dateStr = `${day}-${month}-${year}`

        const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${dateStr}`)
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        
        const data = await res.json()
        if (data.data?.hijri) {
          const hijri = data.data.hijri
          const hijriDay = parseInt(hijri.day, 10)
          setToday({ year: hijri.year, month: hijri.month.number, day: isNaN(hijriDay) ? 1 : hijriDay })
          setCurrentHijri({ year: hijri.year, month: hijri.month.number })
        } else {
          throw new Error('Invalid API response')
        }
      } catch (error) {
        console.warn('Failed to fetch today date:', error)
        // Graceful fallback: keep current state but compute Gregorian today
        const todayDate = new Date()
        setToday({ year: currentHijri.year, month: currentHijri.month, day: todayDate.getDate() })
      }
    }
    fetchTodayDate()
  }, [])

  // Fetch calendar days
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true)
        // Step 1: convert the 1st of the Hijri month to Gregorian to anchor the span
        const anchorRes = await fetch(`https://api.aladhan.com/v1/hToG?date=01-${currentHijri.month}-${currentHijri.year}`)
        if (!anchorRes.ok) throw new Error(`Anchor convert failed ${anchorRes.status}`)
        const anchorData = await anchorRes.json()
        const anchorG = anchorData.data?.gregorian
        if (!anchorG) throw new Error('Invalid anchor response')

        const gMonth = anchorG.month.number
        const gYear = anchorG.year

        // Step 2: fetch two Gregorian months to cover overlap
        const targets = [
          { month: gMonth, year: gYear },
          { month: gMonth === 12 ? 1 : gMonth + 1, year: gMonth === 12 ? gYear + 1 : gYear },
        ]

        const monthPromises = targets.map(t => fetch(`https://api.aladhan.com/v1/gToHCalendar?month=${t.month}&year=${t.year}`))
        const monthResponses = await Promise.all(monthPromises)
        const monthData: any[] = []
        for (const res of monthResponses) {
          if (res.ok) {
            const json = await res.json()
            if (Array.isArray(json.data)) monthData.push(...json.data)
          }
        }

        if (monthData.length === 0) throw new Error('No days found for month')

        // Map and filter to the target Hijri month/year
        const days: HijriDay[] = monthData
          .map((d: any) => {
            const h = d.hijri
            const g = d.gregorian
            const gDateStr = `${g.year}-${String(g.month.number).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`
            const weekday = g.weekday?.en ?? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(gDateStr).getDay()]
            return {
              date: `${h.day}/${h.month.number}/${h.year}`,
              islamic: `${h.day}/${h.month.number}/${h.year}`,
              gregorian: gDateStr,
              dayOfWeek: weekday,
            }
          })
          .filter((d: HijriDay) => {
            const parts = d.islamic.split('/')
            const monthStr = parts[1]
            const yearStr = parts[2]
            return parseInt(monthStr, 10) === currentHijri.month && parseInt(yearStr, 10) === currentHijri.year
          })

        setCalendarDays(days)
      } catch (error) {
        console.warn('Failed to fetch calendar:', error)
        // Fallback: show 29 days without Gregorian mapping to avoid incorrect data
        setCalendarDays(Array.from({ length: 29 }, (_, i) => ({
          date: `${i + 1}/${currentHijri.month}/${currentHijri.year}`,
          islamic: `${i + 1}/${currentHijri.month}/${currentHijri.year}`,
          gregorian: '',
          dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7],
        })))
      } finally {
        setLoading(false)
      }
    }
    fetchCalendar()
  }, [currentHijri])

  const monthNames = [
    'Muharram', 'Safar', 'Rabi al-awwal', 'Rabi al-thani', 'Jumada al-awwal', 'Jumada al-thani',
    'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ]

  const monthArabicNames = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ]

  const getHolidaysForMonth = () => {
    return ISLAMIC_HOLIDAYS_FULL.filter(h => h.month === currentHijri.month)
  }

  const isToday = (dayNum: number) => {
    return today?.year === currentHijri.year && 
           today?.month === currentHijri.month && 
           today?.day === dayNum
  }

  const isHoliday = (dayNum: number) => {
    return ISLAMIC_HOLIDAYS_FULL.some(h => h.month === currentHijri.month && h.day === dayNum)
  }

  const getHolidayInfo = (dayNum: number) => {
    return ISLAMIC_HOLIDAYS_FULL.find(h => h.month === currentHijri.month && h.day === dayNum)
  }

  return (
    <div className="space-y-6 w-full max-w-full px-6 md:px-12 lg:px-16 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Islamic Calendar</h1>
        <p className="text-sm text-gray-500">
          <span style={{ fontFamily: 'var(--font-arabic)' }}>التقويم الهجري</span>
        </p>
      </div>

      {/* Month Navigation Card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentHijri({
              ...currentHijri,
              month: currentHijri.month === 1 ? 12 : currentHijri.month - 1,
              year: currentHijri.month === 1 ? currentHijri.year - 1 : currentHijri.year
            })}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center flex-1">
            <h2 className="text-3xl font-bold mb-2">
              {monthNames[currentHijri.month - 1]}
            </h2>
            <p style={{ fontFamily: 'var(--font-arabic)' }} className="text-xl font-semibold mb-2">
              {monthArabicNames[currentHijri.month - 1]}
            </p>
            <p className="text-white/80 text-sm">
              Year {currentHijri.year} AH / {new Date().getFullYear()} CE
            </p>
          </div>

          <button
            onClick={() => setCurrentHijri({
              ...currentHijri,
              month: currentHijri.month === 12 ? 1 : currentHijri.month + 1,
              year: currentHijri.month === 12 ? currentHijri.year + 1 : currentHijri.year
            })}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Month Holidays */}
        {getHolidaysForMonth().length > 0 && (
          <div className="border-t border-white/30 pt-4">
            <p className="text-sm font-semibold mb-3 text-white/90">Important Dates in this Month:</p>
            <div className="flex flex-wrap gap-2">
              {getHolidaysForMonth().map((holiday) => (
                <div key={holiday.name} className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium">
                  {holiday.day}th: {holiday.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-bold text-sm text-teal-700 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <CalendarDays className="w-12 h-12 text-teal-700 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-600">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 mb-8">
          {calendarDays.map((day, idx) => {
            const dayNum = parseInt(day.islamic.split('/')[0])
            const todayFlag = isToday(dayNum)
            const holidayFlag = isHoliday(dayNum)
            const holiday = holidayFlag ? getHolidayInfo(dayNum) : null

            return (
              <div
                key={idx}
                className={`aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group cursor-pointer relative
                  ${todayFlag
                    ? 'bg-teal-700 text-white shadow-lg ring-2 ring-teal-300'
                    : holidayFlag
                    ? 'bg-amber-50 border-2 border-amber-300 text-amber-900'
                    : 'bg-white border border-gray-200 text-gray-800 hover:shadow-md'
                }`}
              >
                {holiday && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {holiday.name}
                  </div>
                )}
                <p className="font-bold text-lg">{dayNum}</p>
                <p className="text-[10px] text-current/70 mt-1 opacity-75">{day.dayOfWeek}</p>
                {todayFlag && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white" />}
                {holidayFlag && !todayFlag && (
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Holidays List */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-teal-700" />
          Major Islamic Holidays ({currentHijri.year} AH)
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {ISLAMIC_HOLIDAYS_FULL.map((holiday) => (
            <div
              key={holiday.name}
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-700/10 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {holiday.day}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{holiday.name}</p>
                  <p style={{ fontFamily: 'var(--font-arabic)' }} className="text-teal-700 font-semibold text-sm mb-1">
                    {holiday.arabicName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {monthNames[holiday.month - 1]}{' '}
                    <span style={{ fontFamily: 'var(--font-arabic)' }}>
                      {monthArabicNames[holiday.month - 1]}
                    </span>
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  holiday.type === 'Major'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {holiday.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
        <p className="text-gray-700 text-sm">
          {today ? (
            <>
              Today is <span className="font-bold text-teal-700">{monthNames[today.month - 1]} {today.day}, {today.year} AH</span> (
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} CE)
            </>
          ) : (
            <>Loading today…</>
          )}
        </p>
        <p style={{ fontFamily: 'var(--font-arabic)' }} className="text-teal-700 mt-2">
          {today && `اليوم ${numberToArabicWord(today.day)} من ${monthArabicNames[today.month - 1]} سنة ${today.year} هـ`}
        </p>
      </div>
    </div>
  )
}
