import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'

interface Ayah {
  number: number
  text: string
  numberInSurah: number
}

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

type ViewMode = 'verse' | 'continuous'

export function SurahDetail() {
  const { surahNumber } = useParams<{ surahNumber: string }>()
  const navigate = useNavigate()
  const [surah, setSurah] = useState<Surah | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('verse')

  useEffect(() => {
    const fetchSurahDetail = async () => {
      try {
        setLoading(true)
        // Fetch surah details
        const surahRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`)
        const surahData = await surahRes.json()
        
        if (surahData.code === 200) {
          setSurah(surahData.data)
        } else {
          setError('Failed to fetch surah data')
        }

        // Fetch ayahs with Uthmani text from Tanzil project
        const ayahRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
        const ayahData = await ayahRes.json()
        
        if (ayahData.code === 200) {
          setAyahs(ayahData.data.ayahs)
        } else {
          setError('Failed to fetch ayahs')
        }
      } catch (err) {
        setError('Error fetching surah data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSurahDetail()
  }, [surahNumber])

  if (loading) {
    return (
      <div className="space-y-6 pb-6">
        <button
          onClick={() => navigate('/quran')}
          className="flex items-center gap-2 text-[#2f7f5c] hover:text-[#1f5f46] transition"
        >
          <ArrowLeft size={20} />
          Back to Quran
        </button>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f7f5c]"></div>
        </div>
      </div>
    )
  }

  if (error || !surah) {
    return (
      <div className="space-y-6 pb-6">
        <button
          onClick={() => navigate('/quran')}
          className="flex items-center gap-2 text-[#2f7f5c] hover:text-[#1f5f46] transition"
        >
          <ArrowLeft size={20} />
          Back to Quran
        </button>
        <div className="text-center text-red-600 p-8">
          <p>{error || 'Surah not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6 px-4 md:px-6 lg:px-10">
      {/* Back Button */}
      <button
        onClick={() => navigate('/quran')}
        className="flex items-center gap-2 text-[#2f7f5c] hover:text-[#1f5f46] transition font-semibold"
      >
        <ArrowLeft size={20} />
        Back to Quran
      </button>

      {/* Surah Header */}
      <div className="bg-gradient-to-r from-[#2f7f5c] to-[#1f5f46] rounded-xl p-8 shadow-lg text-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{surah.englishName}</h1>
            <p className="text-lg opacity-90">{surah.englishNameTranslation}</p>
            <p className="text-sm opacity-75 mt-1">{surah.revelationType}</p>
          </div>
          <div>
            <p className="text-6xl font-bold opacity-70">{surah.name}</p>
            <p className="text-sm opacity-75 mt-2">Surah {surah.number}</p>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 justify-center sticky top-32 z-10 bg-white py-2">
        <button
          onClick={() => setViewMode('verse')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
            viewMode === 'verse'
              ? 'bg-[#2f7f5c] text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookOpen size={18} />
          Verse by Verse
        </button>
        <button
          onClick={() => setViewMode('continuous')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
            viewMode === 'continuous'
              ? 'bg-[#2f7f5c] text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText size={18} />
          Full Reading
        </button>
      </div>

      {/* Ayahs Container - Verse by Verse View */}
      {viewMode === 'verse' && (
        <div className="space-y-4">
          {ayahs.map((ayah) => (
            <div
              key={ayah.number}
              className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition"
            >
              {/* Ayah Number and Arabic Text */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-right text-2xl leading-relaxed text-gray-800 font-semibold">
                      {ayah.text}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="bg-[#2f7f5c] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm">
                      {ayah.numberInSurah}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ayah Reference */}
              <div className="text-xs text-gray-500 border-t pt-3">
                <p>
                  Surah {surah.number}, Ayah {ayah.numberInSurah}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continuous Reading View */}
      {viewMode === 'continuous' && (
        <div className="bg-white rounded-lg p-12 shadow-md border border-gray-100">
          <div className="max-w-4xl mx-auto">
            {/* Surah Title in Reading View */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[#2f7f5c] mb-2">{surah.name}</h2>
              <p className="text-lg text-gray-700">{surah.englishName}</p>
              <p className="text-sm text-gray-600">{surah.englishNameTranslation}</p>
            </div>

            {/* Bismillah - Large and Prominent */}
            <div className="text-center mb-12 pb-8 border-b-2 border-[#2f7f5c]">
              <p className="text-4xl font-bold text-[#2f7f5c] font-arabic">
                بسم الله الرحمن الرحيم
              </p>
              <p className="text-gray-600 mt-2 text-sm">In the name of Allah, the Most Gracious, the Most Merciful</p>
            </div>

            {/* Ayahs - Book Style with Natural Text Wrapping */}
            <div className="text-right text-2xl leading-loose text-gray-800 font-arabic break-words">
              {ayahs.map((ayah) => (
                <span key={ayah.number} className="inline">
                  {ayah.text}
                  <span className="relative inline-flex items-center justify-center mx-1" style={{verticalAlign: 'middle'}}>
                    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="20" cy="20" r="18" className="text-[#2f7f5c]" />
                      <circle cx="20" cy="20" r="12" opacity="0.3" className="text-[#2f7f5c]" />
                    </svg>
                    <span className="absolute text-xs font-bold text-[#2f7f5c]">
                      {ayah.numberInSurah}
                    </span>
                  </span>
                  {' '}
                </span>
              ))}
            </div>

            {/* End of Surah */}
            <div className="text-center mt-12 border-t border-gray-300 pt-6">
              <p className="text-gray-600 text-sm">End of {surah.englishName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-[#f0f7f4] rounded-lg p-6 text-center">
        <p className="text-gray-700">
          <span className="font-bold text-[#2f7f5c]">{surah.englishName}</span> contains{' '}
          <span className="font-bold text-[#2f7f5c]">{surah.numberOfAyahs}</span> Ayahs
        </p>
      </div>
    </div>
  )
}
