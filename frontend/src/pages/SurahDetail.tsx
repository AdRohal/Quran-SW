import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Settings, X, Play, Pause, Volume2, Copy, SkipBack, Mic } from 'lucide-react'
import { readingAPI } from '../lib/authAPI'

interface Ayah {
  number: number
  text: string
  numberInSurah: number
  translation?: string
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

interface Reciter {
  id: number
  name: string
  recitationId: number
}

const RECITERS: Reciter[] = [
  { id: 1, name: 'Abdul Basit (Mujawwad)', recitationId: 1 },
  { id: 2, name: 'Abdul Basit (Murattal)', recitationId: 2 },
  { id: 3, name: 'Abdullah Al Juhany', recitationId: 3 },
  { id: 4, name: 'Abu Bakr Al Shatri', recitationId: 4 },
  { id: 5, name: 'Abu Bakr Al Shatri 2', recitationId: 5 },
  { id: 6, name: 'Ali Al Hudhaifi', recitationId: 6 },
  { id: 7, name: 'Mishari Rashid Al Afasy', recitationId: 7 },
  { id: 8, name: 'Maher Al Meaqli', recitationId: 8 },
  { id: 9, name: 'Muhammad Ayyub', recitationId: 22 },
  { id: 10, name: 'Yasser Ad Dussary', recitationId: 174 },
]

interface Translation {
  language: string
  languageCode: string
  translator: string
}

const TRANSLATIONS: Translation[] = [
  { language: 'English (Sahih International)', languageCode: 'en.sahih', translator: 'Sahih International' },
  { language: 'English (Yusuf Ali)', languageCode: 'en.yusufali', translator: 'Yusuf Ali' },
  { language: 'English (Pickthall)', languageCode: 'en.pickthall', translator: 'Muhammad Marmaduke Pickthall' },
  { language: 'Arabic (Al-Jalalayn)', languageCode: 'ar.jalalayn', translator: 'Al-Jalalayn' },
  { language: 'French', languageCode: 'fr.hamidullah', translator: 'Muhammad Hamidullah' },
  { language: 'Spanish', languageCode: 'es.asad', translator: 'Muhammad Asad' },
  { language: 'Urdu', languageCode: 'ur.jahangir', translator: 'Jahangir' },
  { language: 'Turkish', languageCode: 'tr.yazir', translator: 'Yazir' },
  { language: 'German', languageCode: 'de.bubenheim', translator: 'Bubenheim' },
  { language: 'Indonesian', languageCode: 'id.indonesian', translator: 'Indonesian' },
]

export function SurahDetail() {
  const { surahNumber } = useParams<{ surahNumber: string }>()
  const navigate = useNavigate()
  const [surah, setSurah] = useState<Surah | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('continuous')
  const [showSettings, setShowSettings] = useState(false)
  const [showMic, setShowMic] = useState(false)
  const [fontSize, setFontSize] = useState(30)
  const [qiraat, setQiraat] = useState<Qiraat>('hafs')
  const [selectedReciter, setSelectedReciter] = useState<number>(1)
  const [selectedTranslation, setSelectedTranslation] = useState<string>('en.sahih')
  const [showTranslationMenu, setShowTranslationMenu] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAyahPlaying, setCurrentAyahPlaying] = useState<number | null>(null)
  const [showReciterMenu, setShowReciterMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; ayahIndex: number | null }>({ visible: false, x: 0, y: 0, ayahIndex: null })
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState<string>('')
  const [highlightedAyahs, setHighlightedAyahs] = useState<Set<number>>(new Set())
  const [passedAyahs, setPassedAyahs] = useState<number[]>([]) // Track passed ayahs: [1, 2, 3...]
  const currentFocusAyahRef = useRef<number>(1) // Current target ayah to match (1-indexed)
  const accumulatedTextRef = useRef<string>('') // All recognized text accumulated
  const audioRef = useRef<HTMLAudioElement>(null)
  const nextAudioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const isPlayingSequenceRef = useRef<boolean>(false)
  const currentVerseIndexRef = useRef<number>(0)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const reciterFoldersRef = useRef<Record<number, string> | null>(null)
  const ayahRefsRef = useRef<Record<number, HTMLSpanElement | null>>({})
  const readRecordedRef = useRef<boolean>(false) // Track if we've recorded read for today

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

  // Fetch translations when selected translation changes
  useEffect(() => {
    const fetchTranslations = async () => {
      if (ayahs.length === 0 || !surahNumber) return

      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/${selectedTranslation}`
        )
        const data = await response.json()
        if (data.code === 200 && data.data.ayahs) {
          setAyahs((prevAyahs) =>
            prevAyahs.map((ayah, index) => ({
              ...ayah,
              translation: data.data.ayahs[index]?.text || '',
            }))
          )
        }
      } catch (err) {
        console.error('Error fetching translation:', err)
      }
    }

    fetchTranslations()
  }, [selectedTranslation, surahNumber, ayahs.length])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      // Stop recording when leaving page
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Stop recording when changing view mode or leaving page
  useEffect(() => {
    if (isRecording) {
      stopRecording()
    }
  }, [viewMode, surahNumber])

  // Auto-scroll to highlighted ayah with smooth behavior
  useEffect(() => {
    if (currentAyahPlaying && isPlaying && viewMode === 'continuous') {
      const ayahElement = ayahRefsRef.current[currentAyahPlaying]
      if (ayahElement) {
        setTimeout(() => {
          ayahElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }, 50)
      }
    }
  }, [currentAyahPlaying, isPlaying, viewMode])

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => {
      setContextMenu({ visible: false, x: 0, y: 0, ayahIndex: null })
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Handle right-click on ayah
  const handleAyahContextMenu = (e: React.MouseEvent, ayahIndex: number) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      ayahIndex,
    })
  }

  // Play from this ayah onwards
  const playFromAyah = (ayahIndex: number) => {
    if (!audioRef.current || !surah || ayahs.length === 0) return

    isPlayingSequenceRef.current = true
    currentVerseIndexRef.current = ayahIndex
    setIsPlaying(true)

    audioRef.current.onended = () => {
      currentVerseIndexRef.current += 1
      if (currentVerseIndexRef.current < ayahs.length && isPlayingSequenceRef.current) {
        playVerseByIndex(currentVerseIndexRef.current)
      } else {
        isPlayingSequenceRef.current = false
        setIsPlaying(false)
        setCurrentAyahPlaying(null)
      }
    }

    playVerseByIndex(ayahIndex)
    setContextMenu({ visible: false, x: 0, y: 0, ayahIndex: null })
  }

  // Copy ayah text to clipboard
  const copyAyah = (ayahIndex: number) => {
    const ayah = ayahs[ayahIndex]
    if (ayah) {
      navigator.clipboard.writeText(ayah.text).then(() => {
        // Optional: Show a toast notification
        console.log('Ayah copied to clipboard')
      })
    }
    setContextMenu({ visible: false, x: 0, y: 0, ayahIndex: null })
  }

  // Normalize Arabic text for comparison - comprehensive normalization
  const normalizeArabic = (text: string): string => {
    return text
      // Remove Quranic special characters and markers
      .replace(/[\u064B-\u0652]/g, '') // Remove all diacritical marks (Fatha, Damma, Kasra, Shadda, Sukun, etc.)
      .replace(/[\u0640]/g, '') // Remove Kashida
      .replace(/[\u200B-\u200D]/g, '') // Remove zero-width characters
      .replace(/[\u061C]/g, '') // Remove invisible format character
      .replace(/\u0640/g, '') // Remove Tatweel
      // Normalize different forms of Alif
      .replace(/أ/g, 'ا') // Alif with Hamza above
      .replace(/إ/g, 'ا') // Alif with Hamza below
      .replace(/آ/g, 'ا') // Alif with Madda
      .replace(/ٱ/g, 'ا') // Alif with Wasla (used in Quran)
      // Normalize Teh and similar
      .replace(/ة/g, 'ه') // Teh Marbuta to Heh
      // Normalize Yeh variants
      .replace(/ى/g, 'ي') // Alif Maksura to Yeh
      .replace(/ؤ/g, 'و') // Waw with Hamza
      .replace(/ئ/g, 'ي') // Yeh with Hamza
      // Normalize spaces
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Helper function to check if two words match - more lenient matching
  const wordsMatch = (word1: string, word2: string): boolean => {
    // Exact match
    if (word1 === word2) return true

    // Both words must be at least 2 characters
    if (word1.length < 2 || word2.length < 2) return false

    const minLength = Math.min(word1.length, word2.length)
    const maxLength = Math.max(word1.length, word2.length)

    // For short words (2-3 chars), require high match
    if (minLength <= 3) {
      const matchedChars = Array.from(word1).filter((char, idx) => word2[idx] === char).length
      return matchedChars / maxLength >= 0.7 // 70% match for short words
    }

    // For longer words, require 75% character match
    const matchedChars = Array.from(word1).filter((char, idx) => word2[idx] === char).length
    return matchedChars / maxLength >= 0.75
  }

  // STRICT SEQUENTIAL MATCHING - Focus only on current target ayah
  // Mark as passed only when LAST WORD is spoken
  // Keep highlight visible until FIRST WORD of next ayah is spoken
  const matchRecognizedText = async (fullText: string) => {
    if (!fullText || ayahs.length === 0) return

    accumulatedTextRef.current = fullText
    const normalizedRecognized = normalizeArabic(fullText).split(' ').filter(w => w.length > 0)

    if (normalizedRecognized.length === 0) return

    // Only try to match against the current focus ayah
    const targetAyahNumber = currentFocusAyahRef.current
    const targetAyahIndex = ayahs.findIndex(a => a.numberInSurah === targetAyahNumber)
    
    if (targetAyahIndex === -1 || targetAyahIndex >= ayahs.length) return

    const targetAyah = ayahs[targetAyahIndex]
    const normalizedAyahWords = normalizeArabic(targetAyah.text).split(' ').filter(w => w.length > 0)
    
    if (normalizedAyahWords.length === 0) return

    // Get the LAST WORD of the target ayah
    const lastAyahWord = normalizedAyahWords[normalizedAyahWords.length - 1]
    
    // Check if any recognized word matches ANY word in the target ayah
    let isPartiallyMatched = false
    for (const recognizedWord of normalizedRecognized) {
      const foundInAyah = normalizedAyahWords.some(ayahWord => 
        wordsMatch(recognizedWord, ayahWord)
      )
      if (foundInAyah) {
        isPartiallyMatched = true
        break
      }
    }

    // Check if the LAST WORD of the ayah has been spoken
    let lastWordMatched = false
    for (const recognizedWord of normalizedRecognized) {
      if (wordsMatch(recognizedWord, lastAyahWord)) {
        lastWordMatched = true
        break
      }
    }

    // Check if FIRST WORD of next ayah has been spoken (to clear current highlight)
    let nextAyahFirstWordMatched = false
    if (targetAyahNumber < ayahs.length) {
      const nextAyahIndex = targetAyahIndex + 1
      const nextAyah = ayahs[nextAyahIndex]
      const normalizedNextAyahWords = normalizeArabic(nextAyah.text).split(' ').filter(w => w.length > 0)
      
      if (normalizedNextAyahWords.length > 0) {
        const nextFirstWord = normalizedNextAyahWords[0]
        for (const recognizedWord of normalizedRecognized) {
          if (wordsMatch(recognizedWord, nextFirstWord)) {
            nextAyahFirstWordMatched = true
            break
          }
        }
      }
    }

    // Highlight ayah if any word matches (partial match)
    if (isPartiallyMatched && !nextAyahFirstWordMatched) {
      const newHighlighted = new Set<number>()
      newHighlighted.add(targetAyahNumber)
      setHighlightedAyahs(newHighlighted)
    } else if (nextAyahFirstWordMatched) {
      // Clear highlight when first word of next ayah is spoken
      setHighlightedAyahs(new Set())
    }

    // Only mark as PASSED when LAST WORD is spoken
    if (lastWordMatched && !passedAyahs.includes(targetAyahNumber)) {
      // Mark this ayah as passed and move to next
      const newPassedAyahs = [...passedAyahs, targetAyahNumber]
      setPassedAyahs(newPassedAyahs)
      
      // Record read if this is Ayah 1 and we haven't recorded yet today
      if (targetAyahNumber === 1 && !readRecordedRef.current) {
        readRecordedRef.current = true
        try {
          await readingAPI.recordRead()
          console.log('✅ Reading streak recorded for today!')
        } catch (error) {
          console.error('Failed to record reading:', error)
        }
      }
      
      // Move focus to next ayah
      if (targetAyahNumber < ayahs.length) {
        currentFocusAyahRef.current = targetAyahNumber + 1
      }
      
      console.log(`✅ Ayah ${targetAyahNumber} COMPLETED! Passed ayahs:`, newPassedAyahs)
    }
  }

  // Start recording and speech recognition
  const startRecording = async () => {
    try {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Speech Recognition not supported in your browser')
        return
      }

      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.lang = 'ar-SA' // Arabic language
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onstart = () => {
          setIsRecording(true)
          setRecognizedText('')
          setHighlightedAyahs(new Set())
          setPassedAyahs([]) // Reset passed ayahs tracking
          currentFocusAyahRef.current = 1 // Start focusing on first ayah
          accumulatedTextRef.current = ''
        }

        recognitionRef.current.onresult = async (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          const fullText = finalTranscript + interimTranscript
          setRecognizedText(fullText)
          await matchRecognizedText(fullText)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }

      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
      setHighlightedAyahs(new Set()) // Clear all highlights when stopping mic
      setRecognizedText('') // Clear recognized text display
    }
  }

  const playAyah = () => {
    if (!audioRef.current || !surah || ayahs.length === 0) return

    isPlayingSequenceRef.current = true
    currentVerseIndexRef.current = 0
    setIsPlaying(true)
    
    // Set up seamless next verse playback
    audioRef.current.onended = () => {
      currentVerseIndexRef.current += 1
      if (currentVerseIndexRef.current < ayahs.length && isPlayingSequenceRef.current) {
        playVerseByIndex(currentVerseIndexRef.current)
      } else {
        isPlayingSequenceRef.current = false
        setIsPlaying(false)
        setCurrentAyahPlaying(null)
      }
    }
    
    playVerseByIndex(0)
  }

  // Play a single ayah without looping or continuing to next ayah
  const playSingleAyah = (ayahIndex: number) => {
    if (!audioRef.current || !surah || ayahs.length === 0) return

    // Stop any previous sequence playback
    if (isPlayingSequenceRef.current && !audioRef.current!.paused) {
      audioRef.current!.pause()
    }

    isPlayingSequenceRef.current = true // Need this true for playVerseByIndex to work
    currentVerseIndexRef.current = ayahIndex
    setIsPlaying(true)
    
    // Set up ended handler that DOES NOT play next verse (key difference from playAyah)
    audioRef.current.onended = () => {
      isPlayingSequenceRef.current = false
      setIsPlaying(false)
      setCurrentAyahPlaying(null)
    }
    
    playVerseByIndex(ayahIndex)
  }

  // Play verse by specific index - OPTIMIZED for speed
  const playVerseByIndex = (verseIndex: number) => {
    if (!audioRef.current || !surah || !isPlayingSequenceRef.current) return
    
    if (verseIndex >= ayahs.length) {
      isPlayingSequenceRef.current = false
      setIsPlaying(false)
      setCurrentAyahPlaying(null)
      return
    }

    const currentAyah = ayahs[verseIndex]
    
    // Build reciter folders once
    if (!reciterFoldersRef.current) {
      reciterFoldersRef.current = {
        1: 'Abdul_Basit_Mujawwad_128kbps',
        2: 'Abdul_Basit_Murattal_192kbps',
        3: 'Abdurrahmaan_As-Sudais_192kbps',
        4: 'Abu_Bakr_Ash-Shaatree_128kbps',
        5: 'Abu_Bakr_Ash-Shaatree_128kbps',
        6: 'Hudhaify_128kbps',
        7: 'Alafasy_128kbps',
        8: 'MaherAlMuaiqly128kbps',
        10: 'Yasser_Ad-Dussary_128kbps'
      }
    }

    console.log(`🎵 ${verseIndex + 1}/${ayahs.length}`)
    
    // Update UI without blocking
    setCurrentAyahPlaying(currentAyah.numberInSurah)
    
    // Build audio URL based on reciter
    let audioUrl: string
    
    if (selectedReciter === 9) {
      // Muhammad Ayyoub - route through audio proxy to bypass CORS
      const absoluteAyahNumber = currentAyah.number
      audioUrl = `/api/quran/audio/${absoluteAyahNumber}?reciter=muhammadayyoub`
    } else if (selectedReciter === 10) {
      // Yasser Ad Dussary - use everyayah.com
      const folder = 'Yasser_Ad-Dussary_128kbps'
      const chapterPadded = String(surah.number).padStart(3, '0')
      const versePadded = String(currentAyah.numberInSurah).padStart(3, '0')
      audioUrl = `https://everyayah.com/data/${folder}/${chapterPadded}${versePadded}.mp3`
    } else {
      // Other reciters use everyayah.com
      const folder = reciterFoldersRef.current[selectedReciter] || reciterFoldersRef.current[1]
      const chapterPadded = String(surah.number).padStart(3, '0')
      const versePadded = String(currentAyah.numberInSurah).padStart(3, '0')
      audioUrl = `https://everyayah.com/data/${folder}/${chapterPadded}${versePadded}.mp3`
    }
    
    // Play immediately
    audioRef.current.src = audioUrl
    audioRef.current.crossOrigin = 'anonymous'
    audioRef.current.play().catch(() => {
      // Skip on error
      currentVerseIndexRef.current += 1
      if (currentVerseIndexRef.current < ayahs.length && isPlayingSequenceRef.current) {
        playVerseByIndex(currentVerseIndexRef.current)
      }
    })
    
    // Pre-load next verse
    if (nextAudioRef.current && verseIndex + 1 < ayahs.length) {
      const nextAyah = ayahs[verseIndex + 1]
      
      let nextUrl: string
      if (selectedReciter === 9) {
        const absoluteAyahNumber = nextAyah.number
        nextUrl = `/api/quran/audio/${absoluteAyahNumber}?reciter=muhammadayyoub`
      } else if (selectedReciter === 10) {
        const folder = 'Yasser_Ad-Dussary_128kbps'
        const chapterPadded = String(surah.number).padStart(3, '0')
        const nextVersionPadded = String(nextAyah.numberInSurah).padStart(3, '0')
        nextUrl = `https://everyayah.com/data/${folder}/${chapterPadded}${nextVersionPadded}.mp3`
      } else {
        const folder = reciterFoldersRef.current[selectedReciter] || reciterFoldersRef.current[1]
        const chapterPadded = String(surah.number).padStart(3, '0')
        const nextVersionPadded = String(nextAyah.numberInSurah).padStart(3, '0')
        nextUrl = `https://everyayah.com/data/${folder}/${chapterPadded}${nextVersionPadded}.mp3`
      }
      
      nextAudioRef.current.src = nextUrl
      nextAudioRef.current.crossOrigin = 'anonymous'
      nextAudioRef.current.preload = 'auto'
    }
  }

  const playSurahContinuous = () => {
    if (ayahs.length === 0) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      isPlayingSequenceRef.current = false
      setIsPlaying(false)
      setCurrentAyahPlaying(null)
      return
    }

    playAyah()
  }

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

      <div className="sticky top-0 z-20 bg-white shadow-lg">
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-8 text-white">
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

        <div className="flex gap-2 justify-center bg-white py-2 px-4 border-b border-gray-200">
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

        {/* Audio Player Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setShowReciterMenu(!showReciterMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              <Volume2 size={20} />
              {RECITERS.find((r) => r.id === selectedReciter)?.name || 'Select Reciter'}
            </button>

            {viewMode === 'verse' && (
              <button
                onClick={() => setShowTranslationMenu(!showTranslationMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                <FileText size={20} />
                {TRANSLATIONS.find((t) => t.languageCode === selectedTranslation)?.language || 'Select Language'}
              </button>
            )}

            {viewMode === 'continuous' && (
              <button
                onClick={playSurahContinuous}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
              >
                {isPlaying ? (
                  <>
                    <Pause size={20} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Play Surah
                  </>
                )}
              </button>
            )}
          </div>
        </div>

          {showReciterMenu && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {RECITERS.map((reciter) => (
                <button
                  key={reciter.id}
                  onClick={() => {
                    setSelectedReciter(reciter.id)
                    setShowReciterMenu(false)
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    selectedReciter === reciter.id
                      ? 'bg-green-500 text-white'
                      : 'bg-teal-700 text-white hover:bg-teal-600'
                  }`}
                >
                  {reciter.name}
                </button>
              ))}
            </div>
          )}

          {showTranslationMenu && viewMode === 'verse' && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {TRANSLATIONS.map((translation) => (
                <button
                  key={translation.languageCode}
                  onClick={() => {
                    setSelectedTranslation(translation.languageCode)
                    setShowTranslationMenu(false)
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                    selectedTranslation === translation.languageCode
                      ? 'bg-green-500 text-white'
                      : 'bg-teal-700 text-white hover:bg-teal-600'
                  }`}
                >
                  {translation.language}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} />
      <audio ref={nextAudioRef} />

      {viewMode === 'verse' && (
        <div className="space-y-4">
          {ayahs.map((ayah, index) => (
            <div
              key={ayah.number}
              className={`bg-white rounded-lg p-6 shadow-md border transition ${
                currentAyahPlaying === ayah.numberInSurah
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-100 hover:shadow-lg'
              }`}
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <p className="text-right text-2xl leading-relaxed text-gray-800 font-semibold mb-4">
                      {ayah.text}
                    </p>
                    {ayah.translation && (
                      <p className="text-left text-sm leading-relaxed text-gray-700 italic bg-gray-50 p-3 rounded-lg border-l-4 border-teal-700">
                        {ayah.translation}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (currentAyahPlaying === ayah.numberInSurah && isPlaying && audioRef.current) {
                          // Pause the current ayah
                          audioRef.current.pause()
                          setIsPlaying(false)
                        } else {
                          // Play the ayah
                          playSingleAyah(index)
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition ${
                        currentAyahPlaying === ayah.numberInSurah && isPlaying
                          ? 'bg-green-600 text-white'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                      }`}
                    >
                      {currentAyahPlaying === ayah.numberInSurah && isPlaying ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </button>
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
              className="text-right text-gray-800 break-words"
              style={{ fontFamily: "'Amiri Quran', 'Amiri', serif", direction: 'rtl', fontSize: `${fontSize}px`, lineHeight: '2.5' }}
            >
              {ayahs.map((ayah, index) => (
                <span
                  key={ayah.number}
                  ref={(el) => {
                    if (el) ayahRefsRef.current[ayah.numberInSurah] = el
                  }}
                  onContextMenu={(e) => handleAyahContextMenu(e, index)}
                  className={`inline transition-all duration-100 rounded px-1 cursor-context-menu ${
                    currentAyahPlaying === ayah.numberInSurah && isPlaying
                      ? 'bg-yellow-300/60 text-gray-900 font-bold shadow-md'
                      : highlightedAyahs.has(ayah.numberInSurah)
                      ? 'bg-yellow-300/40 hover:bg-yellow-300/60'
                      : 'hover:bg-green-300/40'
                  }`}
                  style={{ direction: 'rtl', padding: '0.125rem 0.25rem' }}
                >
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

          <button
            onClick={() => setShowMic(!showMic)}
            className="fixed bg-teal-700 hover:bg-teal-900 text-white rounded-full p-4 shadow-lg transition z-40"
            style={{ bottom: '24px', right: '100px' }}
          >
            <Mic size={24} />
          </button>

          {showSettings && (
            <div className="fixed bg-white rounded-lg shadow-2xl p-6 w-80 z-40 border border-gray-200" style={{ bottom: '80px', right: '30px', marginBottom: '24px' }}>
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

          {showMic && (
            <div className="fixed bg-white rounded-lg shadow-2xl p-6 w-80 z-40 border border-gray-200" style={{ bottom: '80px', right: '100px', marginBottom: '24px' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-teal-700">Voice Recording</h3>
                <button onClick={() => setShowMic(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              {!isRecording ? (
                <div className="text-center">
                  <div className="bg-teal-50 rounded-lg p-6 mb-4">
                    <Mic size={48} className="mx-auto text-teal-700 mb-2" />
                    <p className="text-gray-700 font-semibold">Record your recitation</p>
                    <p className="text-xs text-gray-500 mt-1">Tap the record button to start</p>
                  </div>
                  <button 
                    onClick={startRecording}
                    className="w-full bg-teal-700 hover:bg-teal-900 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Start Recording
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-red-50 rounded-lg p-6 mb-4">
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" style={{ opacity: 0.3 }}></div>
                        <Mic size={48} className="text-red-600 relative" />
                      </div>
                    </div>
                    <p className="text-gray-700 font-semibold">Recording...</p>
                    <p className="text-xs text-gray-500 mt-1">Speak your Quranic text</p>
                  </div>
                  
                  {recognizedText && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-right max-h-24 overflow-y-auto">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Recognized Text:</p>
                      <p className="text-sm text-gray-800 font-arabic" style={{ fontFamily: "'Amiri Quran', serif" }}>
                        {recognizedText}
                      </p>
                    </div>
                  )}
                  
                  <button 
                    onClick={stopRecording}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Stop Recording
                  </button>
                </div>
              )}
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

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.ayahIndex !== null && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <button
            onClick={() => playFromAyah(contextMenu.ayahIndex!)}
            className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-teal-50 text-gray-700 hover:text-teal-700 font-semibold transition border-b border-gray-100 hover:border-teal-200"
          >
            <SkipBack size={18} className="text-teal-600" />
            Start from this Ayah
          </button>
          <button
            onClick={() => playSingleAyah(contextMenu.ayahIndex!)}
            className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-teal-50 text-gray-700 hover:text-teal-700 font-semibold transition border-b border-gray-100 hover:border-teal-200"
          >
            <Play size={18} className="text-teal-600" />
            Play this Ayah only
          </button>
          <button
            onClick={() => copyAyah(contextMenu.ayahIndex!)}
            className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-teal-50 text-gray-700 hover:text-teal-700 font-semibold transition hover:border-teal-200"
          >
            <Copy size={18} className="text-teal-600" />
            Copy Ayah
          </button>
        </div>
      )}    </div>
  )
}