import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Settings, X } from 'lucide-react'

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
type Qiraat = 'hafs' | 'warsh'

export function SurahDetail() {
  const { surahNumber } = useParams<{ surahNumber: string }>()
  const navigate = useNavigate()
  const [surah, setSurah] = useState<Surah | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('verse')
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(24)
  const [qiraat, setQiraat] = useState<Qiraat>('hafs')

  useEffect(() => {
    const fetchSurahDetail = async () => {
      try {
        setLoading(true)
        const surahRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`)
        const surahData = await surahRes.json()
        if (surahData.code === 200) {
          setSurah(surahData.data)
        } else {
          setError('Failed to fetch surah data')
        }

        if (qiraat === 'warsh') {
          const warshRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.warsh`)
          const warshData = await warshRes.json()
          if (warshData.code === 200) {
            setAyahs(warshData.data.ayahs)
          } else {
            setError('Failed to fetch Warsh recitation')
          }
        } else {
          const response = await fetch(
            `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=en&words=false&per_page=300&fields=text_uthmani`
          )
          const data = await response.json()
          if (data.verses) {
            const transformed = data.verses.map((v: any) => ({
              number: v.id,
              text: v.text_uthmani || '',
              numberInSurah: v.verse_number,
            }))
            setAyahs(transformed)
          } else {
            const fallbackRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
            const fallbackData = await fallbackRes.json()
            if (fallbackData.code === 200) {
              setAyahs(fallbackData.data.ayahs)
            } else {
              setError('Failed to fetch ayahs')
            }
          }
        }
      } catch (err) {
        setError('Error fetching surah data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSurahDetail()
  }, [surahNumber, qiraat])

  if (loading) {
    return (
      <div className="space-y-6 pb-6">
        <button
          onClick={() => navigate('/quran')}
          className="flex items-center gap-2 text-teal-700 hover:text-teal-900 transition"
        >
          <ArrowLeft size={20} />
          Back to Quran
        </button>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-700" />
        </div>
      </div>
    )
  }

  if (error || !surah) {
    return (
      <div className="space-y-6 pb-6">
        <button
          onClick={() => navigate('/quran')}
          className="flex items-center gap-2 text-teal-700 hover:text-teal-900 transition"
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
      <button
        onClick={() => navigate('/quran')}
        className="flex items-center gap-2 text-teal-700 hover:text-teal-900 transition font-semibold"
      >
        <ArrowLeft size={20} />
        Back to Quran
      </button>

      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-8 shadow-lg text-white sticky top-0 z-10">
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

      <div className="flex gap-2 justify-center sticky top-32 z-10 bg-white py-2">
        <button
          onClick={() => setViewMode('verse')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
            viewMode === 'verse'
              ? 'bg-teal-700 text-white shadow-md'
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
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText size={18} />
          Full Reading
        </button>
      </div>

      {viewMode === 'verse' && (
        <div className="space-y-4">
          {ayahs.map((ayah) => (
            <div
              key={ayah.number}
              className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-right text-2xl leading-relaxed text-gray-800 font-semibold">
                      {ayah.text}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="bg-teal-700 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm">
                      {ayah.numberInSurah}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-3">
                <p>
                  Surah {surah.number}, Ayah {ayah.numberInSurah}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'continuous' && (
        <div className="bg-white rounded-lg p-12 shadow-md border border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-teal-700 mb-2">{surah.name}</h2>
              <p className="text-lg text-gray-700">{surah.englishName}</p>
              <p className="text-sm text-gray-600">{surah.englishNameTranslation}</p>
            </div>

            <div className="text-center mb-12 pb-8 border-b-2 border-teal-700">
              <p
                className="text-4xl font-bold text-teal-700 mb-4"
                style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
              >
                بسم الله الرحمن الرحيم
              </p>
              <p className="text-gray-600 text-sm">In the name of Allah, the Most Gracious, the Most Merciful</p>
            </div>

            <div
              className="text-right leading-loose text-gray-800 break-words"
              style={{ fontFamily: "'Amiri Quran', 'Amiri', serif", direction: 'rtl', fontSize: `${fontSize}px` }}
            >
              {ayahs.map((ayah) => (
                <span key={ayah.number} className="inline" style={{ direction: 'rtl' }}>
                  {ayah.text}
                  <span className="relative inline-flex items-center justify-center mx-2 align-middle">
                    <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="20" cy="20" r="18" className="text-teal-700" />
                      <circle cx="20" cy="20" r="12" opacity="0.3" className="text-teal-700" />
                    </svg>
                    <span className="absolute text-xs font-bold text-teal-700" style={{ fontFamily: 'sans-serif' }}>
                      {ayah.numberInSurah}
                    </span>
                  </span>{' '}
                </span>
              ))}
            </div>

            <div className="text-center mt-12 border-t border-gray-300 pt-6">
              <p className="text-gray-600 text-sm">End of {surah.englishName}</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'continuous' && (
        <>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="fixed bg-teal-700 hover:bg-teal-900 text-white rounded-full p-4 shadow-lg transition z-40"
            style={{ bottom: '24px', right: '30px' }}
          >
            <Settings size={24} />
          </button>

          {showSettings && (
            <div className="fixed right-6 bg-white rounded-lg shadow-2xl p-6 w-80 z-40 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-teal-700">Reading Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qira'at (Recitation Style)</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="qiraat"
                      value="hafs"
                      checked={qiraat === 'hafs'}
                      onChange={() => setQiraat('hafs')}
                      className="mr-3 accent-teal-700"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Hafs (عن عاصم)</p>
                      <p className="text-xs text-gray-500">Most common - Used by 95% of Muslims</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="qiraat"
                      value="warsh"
                      checked={qiraat === 'warsh'}
                      onChange={() => setQiraat('warsh')}
                      className="mr-3 accent-teal-700"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Warsh (عن نافع)</p>
                      <p className="text-xs text-gray-500">Popular in North & West Africa</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-[#f0f7f4] rounded-lg p-6 text-center">
        <p className="text-gray-700">
          <span className="font-bold text-teal-700">{surah.englishName}</span> contains{' '}
          <span className="font-bold text-teal-700">{surah.numberOfAyahs}</span> Ayahs
        </p>
      </div>
    </div>
  )
}
