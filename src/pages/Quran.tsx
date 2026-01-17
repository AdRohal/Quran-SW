import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

export function Quran() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://api.alquran.cloud/v1/surah')
        const data = await response.json()
        if (data.code === 200) {
          setSurahs(data.data)
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

    fetchSurahs()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 pb-6 px-4 md:px-6 lg:px-10">
        <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10">
          <h1 className="text-3xl font-bold text-[#2f7f5c] mb-1">The Noble Quran</h1>
          <p className="text-[#6b8a78]">Read, Listen, and Memorize</p>
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f7f5c]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-6 px-4 md:px-6 lg:px-10">
        <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10">
          <h1 className="text-3xl font-bold text-[#2f7f5c] mb-1">The Noble Quran</h1>
          <p className="text-[#6b8a78]">Read, Listen, and Memorize</p>
        </div>
        <div className="text-center text-red-600 p-8">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6 px-4 md:px-6 lg:px-10">
      <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-[#2f7f5c] mb-1">The Noble Quran</h1>
        <p className="text-[#6b8a78]">Read, Listen, and Memorize all {surahs.length} Surahs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {surahs.map((surah) => (
          <div
            key={surah.number}
            onClick={() => navigate(`/quran/surah/${surah.number}`)}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition cursor-pointer border border-gray-100 hover:border-[#2f7f5c]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                  {surah.revelationType === 'Meccan' ? 'Meccan' : 'Medinan'}
                </p>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{surah.englishName}</h3>
                <p className="text-gray-600">{surah.englishNameTranslation}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-[#2f7f5c] to-[#1f5f46] text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg">
                  {surah.number}
                </div>
                <p className="text-right text-[#2f7f5c] font-semibold mt-2 text-xs">{surah.name}</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{surah.numberOfAyahs} Ayahs</span>
              <span className="text-[#2f7f5c] font-semibold">▶ Read</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
