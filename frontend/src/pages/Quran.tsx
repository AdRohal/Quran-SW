import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { readingAPI } from '../lib/authAPI'

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

interface MemorizedData {
  [surahNumber: number]: {
    memorizedCount: number
    totalAyahs: number
    percentage: number
  }
}

export function Quran() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [memorizedData, setMemorizedData] = useState<MemorizedData>({})
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch surahs
        const response = await fetch('https://api.alquran.cloud/v1/surah')
        const data = await response.json()
        if (data.code === 200) {
          setSurahs(data.data)
          
          // Fetch memorization data for ALL surahs in parallel (not sequentially)
          const memorizedDataMap: MemorizedData = {}
          const memPromises = data.data.map(async (surah: Surah) => {
            try {
              const memData = await readingAPI.getMemorizationProgress(surah.number)
              memorizedDataMap[surah.number] = {
                memorizedCount: memData.memorizedAyahs?.length || 0,
                totalAyahs: surah.numberOfAyahs,
                percentage: memData.totalPercentage || 0,
              }
            } catch (err) {
              // If not logged in or no data, set to 0
              memorizedDataMap[surah.number] = {
                memorizedCount: 0,
                totalAyahs: surah.numberOfAyahs,
                percentage: 0,
              }
            }
          })
          
          // Wait for all requests to complete in parallel
          await Promise.all(memPromises)
          setMemorizedData(memorizedDataMap)
        } else {
          setError('Failed to fetch Quran data')
        }
      } catch (err) {
        setError('Error fetching Quran data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 pb-6 px-6 md:px-12 lg:px-16">
        <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10">
          <h1 className="text-3xl font-bold text-teal-700 mb-1">The Noble Quran</h1>
          <p className="text-teal-700">Read, Listen, and Memorize</p>
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-700"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-6 px-6 md:px-12 lg:px-16">
        <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10">
          <h1 className="text-3xl font-bold text-teal-700 mb-1">The Noble Quran</h1>
          <p className="text-teal-700">Read, Listen, and Memorize</p>
        </div>
        <div className="text-center text-red-600 p-8">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6 px-6 md:px-12 lg:px-16">
      <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-teal-700 mb-1">The Noble Quran</h1>
            <p className="text-teal-700">Read, Listen, and Memorize all {surahs.length} Surahs</p>
          </div>
          <div className="relative flex-shrink-0 w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search surah by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* TEST CARD: Load Fatiha from JSON file */}
        <div
          onClick={() => navigate(`/quran/surah/1?source=json`)}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 shadow-md hover:shadow-xl transition cursor-pointer border-2 border-orange-300 hover:border-orange-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-orange-600 mb-1 font-bold">
                🧪 JSON TEST
              </p>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Al-Fatiha (JSON)</h3>
              <p className="text-gray-600">Test JSON file display</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl text-orange-600 font-bold" style={{fontFamily: "'Amiri Quran', 'Amiri', serif"}}>الفاتحة</p>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg flex-shrink-0">
                1
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>7 Ayahs</span>
            <span className="text-orange-600 font-semibold">Test</span>
          </div>
        </div>

        {/* TEST CARD: Load Al-Inshiqaq from JSON file - Test Sajdah marker */}
        <div
          onClick={() => navigate(`/quran/surah/84?source=json`)}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-xl transition cursor-pointer border-2 border-purple-300 hover:border-purple-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-purple-600 mb-1 font-bold">
                🧪 SAJDAH TEST
              </p>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Al-Inshiqaq (JSON)</h3>
              <p className="text-gray-600">Test Sajdah marker ۩</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl text-purple-600 font-bold" style={{fontFamily: "'Amiri Quran', 'Amiri', serif"}}>الإنشقاق</p>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg flex-shrink-0">
                84
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>25 Ayahs</span>
            <span className="text-purple-600 font-semibold">Test</span>
          </div>
        </div>

        {surahs
          .filter((surah) => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
              surah.englishName.toLowerCase().includes(query) ||
              surah.englishNameTranslation.toLowerCase().includes(query) ||
              surah.name.includes(searchQuery) ||
              surah.number.toString().includes(query)
            )
          })
          .map((surah) => {
            const memData = memorizedData[surah.number] || { memorizedCount: 0, totalAyahs: surah.numberOfAyahs, percentage: 0 }
            const isFullyMemorized = memData.percentage === 100
            
            return (
            <div
              key={surah.number}
              onClick={() => navigate(`/quran/surah/${surah.number}`)}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition cursor-pointer border border-gray-100 hover:border-teal-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                    {surah.revelationType === 'Meccan' ? 'Meccan' : 'Medinan'}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{surah.englishName}</h3>
                  <p className="text-gray-600">{surah.englishNameTranslation}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-3xl text-teal-700 font-bold" style={{fontFamily: "'Amiri Quran', 'Amiri', serif"}}>{surah.name}</p>
                  <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg flex-shrink-0">
                    {surah.number}
                  </div>
                </div>
              </div>

              {/* Memorization Progress */}
              {memData.percentage > 0 && (
                <div className="mb-3">
                  {isFullyMemorized ? (
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                      ✓ Memorized
                    </span>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {memData.memorizedCount}/{memData.totalAyahs} Ayahs
                        </span>
                        <span className="text-sm font-bold text-teal-700">{memData.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-700 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${memData.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{surah.numberOfAyahs} Ayahs</span>
                <span className="text-teal-700 font-semibold">Read</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
