import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Settings, X, Play, Pause, Volume2, Copy, SkipBack, Mic } from 'lucide-react'
import { readingAPI } from '../lib/authAPI'

interface Ayah {
  number: number
  text: string
  numberInSurah: number
  translation?: string
  tajweed?: Array<{letter: string; position: number; rule: string; color: string; description: string}>
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
type QuranFont = 'amiri' | 'scheherazade' | 'tajweed'

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
  
  // Debug: log every render
  console.log('📝 SurahDetail component rendering, quranFont will be accessed in render')
  
  const [surah, setSurah] = useState<Surah | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('continuous')
  const [showSettings, setShowSettings] = useState(false)
  const [showMic, setShowMic] = useState(false)
  const [fontSize, setFontSize] = useState(30)
  const [qiraat, setQiraat] = useState<Qiraat>('hafs')
  const [quranFont, setQuranFont] = useState<QuranFont>('amiri')
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
  const [isMemorizeMode, setIsMemorizeMode] = useState(false) // Toggle for hiding text
  const [memorizedAyahs, setMemorizedAyahs] = useState<Map<number, boolean>>(new Map()) // Track which ayahs are memorized
  // const [memorizationPercentage, setMemorizationPercentage] = useState(0) // Overall surah memorization % - Disabled for now
  const [matchedWords, setMatchedWords] = useState<Map<number, Set<number>>>(new Map()) // Track matched word POSITIONS (indices) per ayah
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
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const passedAyahsRef = useRef<number[]>([]) // Ref to always have current passed ayahs
  const matchedWordsRef = useRef<Map<number, Set<number>>>(new Map()) // Ref to always have current matched word positions
  const lastProcessedResultIndexRef = useRef<number>(-1) // Track last processed speech result to avoid reprocessing
  const previousTranscriptRef = useRef<string>('') // Track previous transcript to find new words

  useEffect(() => {
    const fetchSurahDetail = async () => {
      try {
        setLoading(true)
        
        // Check if loading from JSON (test mode)
        const params = new URLSearchParams(window.location.search)
        const sourceType = params.get('source')
        
        console.log('📡 Source type:', sourceType)
        
        if (sourceType === 'json') {
          // Load from JSON file
          const jsonQiraah = qiraat === 'warsh' ? 'warsh' : 'hafs'
          const surahNum = String(surahNumber).padStart(3, '0')
          const url = `/data/quran/${jsonQiraah}/surah-${surahNum}.json`
          console.log('📡 Fetching from:', url)
          
          const jsonRes = await fetch(url)
          
          if (!jsonRes.ok) {
            throw new Error(`Failed to fetch JSON: ${jsonRes.status} ${jsonRes.statusText}`)
          }
          
          const jsonData = await jsonRes.json()
          console.log('📡 JSON Data loaded:', jsonData)
          
          if (jsonData && jsonData.surah) {
            const surahData = jsonData.surah
            setSurah({
              number: surahData.number,
              name: surahData.name_ar,
              englishName: surahData.name_en,
              englishNameTranslation: surahData.type === 'makkiyah' ? 'Meccan' : 'Medinan',
              numberOfAyahs: surahData.ayahs.length,
              revelationType: surahData.type === 'makkiyah' ? 'Meccan' : 'Medinan'
            })
            
            const transformedAyahs = surahData.ayahs.map((ayah: any) => ({
              number: ayah.number,
              text: ayah.text,
              numberInSurah: ayah.number,
              tajweed: ayah.tajweed,
            }))
            console.log('📡 Transformed Ayahs with tajweed:', transformedAyahs)
            setAyahs(transformedAyahs)
            console.log(`✅ Loaded Surah ${surahNumber} from JSON file (${jsonQiraah})`)
          } else {
            setError('Failed to load JSON surah data')
          }
        } else {
          // Load from API (default)
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

  // Load memorization progress for current surah
  useEffect(() => {
    const loadMemorizationProgress = async () => {
      try {
        if (!surahNumber) return
        const data = await readingAPI.getMemorizationProgress(parseInt(surahNumber))
        // setMemorizationPercentage(data.totalPercentage) // Disabled for now
        
        // Create a map of memorized ayahs
        const memorizedMap = new Map()
        data.memorizedAyahs.forEach((item: any) => {
          for (let i = item.ayah_start; i <= item.ayah_end; i++) {
            memorizedMap.set(i, true)
          }
        })
        setMemorizedAyahs(memorizedMap)
      } catch (error) {
        console.error('Error loading memorization progress:', error)
      }
    }

    loadMemorizationProgress()
  }, [surahNumber])

  // Sync passedAyahsRef with passedAyahs state to prevent stale closures
  useEffect(() => {
    passedAyahsRef.current = passedAyahs
    console.log(`📌 Synced passedAyahsRef to:`, passedAyahs)
  }, [passedAyahs])

  // Sync matchedWordsRef with matchedWords state to prevent stale closures
  useEffect(() => {
    matchedWordsRef.current = new Map(matchedWords)
    console.log(`📌 Synced matchedWordsRef`)
  }, [matchedWords])

  // Load and save passed ayahs from/to localStorage
  // Only save when explicitly stopping recording or leaving the page
  useEffect(() => {
    if (!surahNumber || passedAyahs.length === 0) return
    
    // Save passed ayahs to localStorage whenever they change
    const storageKey = `passedAyahs_${surahNumber}`
    localStorage.setItem(storageKey, JSON.stringify(passedAyahs))
    console.log(`💾 Saved passed ayahs for surah ${surahNumber}:`, passedAyahs)
  }, [passedAyahs, surahNumber])

  // Save last read surah to localStorage
  useEffect(() => {
    if (surah && surahNumber) {
      localStorage.setItem('lastReadSurah', JSON.stringify({
        surahNumber: surahNumber,
        surahName: surah.englishName || surah.name,
        scrollPosition: contentContainerRef.current?.scrollTop || 0,
        fontSize: fontSize,
        qiraat: qiraat,
        selectedReciter: selectedReciter,
        selectedTranslation: selectedTranslation,
        viewMode: viewMode
      }))
    }
  }, [surah, surahNumber, fontSize, qiraat, selectedReciter, selectedTranslation, viewMode])

  // Track scroll position periodically
  useEffect(() => {
    const handleScroll = () => {
      if (surah && surahNumber && contentContainerRef.current) {
        const stored = localStorage.getItem('lastReadSurah')
        if (stored) {
          const data = JSON.parse(stored)
          data.scrollPosition = contentContainerRef.current.scrollTop
          localStorage.setItem('lastReadSurah', JSON.stringify(data))
        }
      }
    }

    const container = contentContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [surah, surahNumber])

  // Restore last reading session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lastReadSurah')
      if (saved) {
        const data = JSON.parse(saved)
        // Only restore settings if we're on the same surah
        if (data.surahNumber === surahNumber) {
          if (data.fontSize) setFontSize(data.fontSize)
          if (data.qiraat) setQiraat(data.qiraat)
          if (data.selectedReciter) setSelectedReciter(data.selectedReciter)
          if (data.selectedTranslation) setSelectedTranslation(data.selectedTranslation)
          if (data.viewMode) setViewMode(data.viewMode)
          
          // Restore scroll position after content is rendered
          setTimeout(() => {
            if (contentContainerRef.current && data.scrollPosition) {
              contentContainerRef.current.scrollTop = data.scrollPosition
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('Failed to restore reading session:', error)
    }
  }, [surahNumber])

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
      // Normalize Waw variants
      .replace(/ۆ/g, 'و') // Kurdish Waw variant
      // Normalize spaces and trim
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Helper function to get font family based on selection
  const getQuranFontFamily = (): string => {
    switch (quranFont) {
      case 'scheherazade':
        return "'Scheherazade New', serif"
      case 'tajweed':
        return "'Amiri', serif"
      case 'amiri':
      default:
        return "'Amiri', serif"
    }
  }

  // Helper function to render tajweed colored text from JSON data
  /* 
  // TAJWEED RENDERING DISABLED FOR NOW - Keep for future use
  const renderTajweedText = (ayah: any): React.ReactNode => {
    if (!ayah.tajweed || ayah.tajweed.length === 0) return ayah.text

    console.log('🎨 Rendering tajweed for:', ayah.text, 'with rules:', ayah.tajweed)

    const tajweedMap = new Map<number, {color: string, description: string}>()
    
    // For each tajweed rule, find the nth occurrence of that letter
    ayah.tajweed.forEach((rule: any) => {
      const text = ayah.text
      let occurrenceCount = 0
      
      // Find the nth occurrence of the letter
      for (let i = 0; i < text.length; i++) {
        if (text[i] === rule.letter) {
          occurrenceCount++
          if (occurrenceCount === rule.position) {
            // Found the target occurrence
            tajweedMap.set(i, { color: rule.color, description: rule.description })
            console.log(`✅ Found ${rule.letter} at index ${i} (occurrence ${rule.position})`)
            break
          }
        }
      }
    })

    const result: React.ReactNode[] = []
    ayah.text.split('').forEach((letter: string, idx: number) => {
      const tajweedRule = tajweedMap.get(idx)
      if (tajweedRule) {
        result.push(
          <span
            key={`tajweed-${idx}`}
            style={{
              color: tajweedRule.color,
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: tajweedRule.color,
              textUnderlineOffset: '2px'
            }}
            title={tajweedRule.description}
          >
            {letter}
          </span>
        )
      } else {
        result.push(letter)
      }
    })

    console.log('🎨 Tajweed map:', tajweedMap)
    return result
  }
  */

  // Helper function to check if two words match - fuzzy matching
  const wordsMatch = (word1: string, word2: string): boolean => {
    // Exact match
    if (word1 === word2) return true

    // Both words must be at least 1 character
    if (word1.length < 1 || word2.length < 1) return false

    const minLength = Math.min(word1.length, word2.length)
    const maxLength = Math.max(word1.length, word2.length)

    // Check if one contains the other (substring match)
    // e.g., "الله" contains "الل" or vice versa
    if (word1.includes(word2) || word2.includes(word1)) {
      return true
    }

    // Levenshtein-like distance check - count how many characters match at same position
    let matchedChars = 0
    for (let i = 0; i < minLength; i++) {
      if (word1[i] === word2[i]) {
        matchedChars++
      }
    }

    // If they're very similar in length and have good overlap, consider them a match
    const lengthDiff = Math.abs(word1.length - word2.length)
    const matchPercentage = matchedChars / maxLength

    // Very lenient matching:
    // - If length difference is small (1-2 chars) and 50%+ match, it's a match
    // - If same length and 60%+ match, it's a match
    if (lengthDiff <= 2 && matchPercentage >= 0.5) {
      return true
    }
    if (lengthDiff === 0 && matchPercentage >= 0.6) {
      return true
    }

    return false
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

    // Track which word POSITIONS (indices) match
    const matchedWordsSet = new Set<number>()
    const currentMatchedPositions = matchedWordsRef.current.get(targetAyahNumber) || new Set<number>()
    
    // For each recognized word, find only the FIRST unmatched position
    for (const recognizedWord of normalizedRecognized) {
      for (let i = 0; i < normalizedAyahWords.length; i++) {
        const ayahWord = normalizedAyahWords[i]
        
        // Skip if this position is already matched or already matched in this event
        if (currentMatchedPositions.has(i) || matchedWordsSet.has(i)) continue
        
        if (wordsMatch(recognizedWord, ayahWord)) {
          matchedWordsSet.add(i) // Add only the first unmatched position
          break // Move to next recognized word
        }
      }
    }

    // Update matched word positions for this ayah
    if (matchedWordsSet.size > 0) {
      const newMatchedWords = new Map(matchedWordsRef.current)
      const updatedPositions = new Set([...currentMatchedPositions, ...matchedWordsSet])
      newMatchedWords.set(targetAyahNumber, updatedPositions)
      setMatchedWords(newMatchedWords)
      
      // IMPORTANT: Also highlight this ayah so words can render
      const newHighlighted = new Set<number>()
      newHighlighted.add(targetAyahNumber)
      setHighlightedAyahs(newHighlighted)
      
      console.log(`📍 Ayah ${targetAyahNumber} - Positions: ${Array.from(updatedPositions).join(',')} | New matched: ${Array.from(matchedWordsSet).join(',')}`)
    }

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
    if (lastWordMatched && !passedAyahsRef.current.includes(targetAyahNumber)) {
      // Mark this ayah as passed and move to next
      const newPassedAyahs = [...passedAyahsRef.current, targetAyahNumber]
      setPassedAyahs(newPassedAyahs)
      console.log(`✅ Ayah ${targetAyahNumber} COMPLETED! Passed ayahs:`, newPassedAyahs)
      
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

      // If in memorize mode, save this ayah to memorization progress
      if (isMemorizeMode && surah) {
        try {
          await readingAPI.saveMemorization(surah.number, targetAyahNumber, targetAyahNumber)
          // Update memorized ayahs map
          const newMemorizedMap = new Map(memorizedAyahs)
          newMemorizedMap.set(targetAyahNumber, true)
          setMemorizedAyahs(newMemorizedMap)
          // Recalculate percentage
          const percentage = Math.round((newMemorizedMap.size / surah.numberOfAyahs) * 100)
          // setMemorizationPercentage(percentage) // Disabled for now
          console.log(`✅ Ayah ${targetAyahNumber} memorized! Progress: ${percentage}%`)
        } catch (error) {
          console.error('Failed to save memorization:', error)
        }
      }
      
      // Move focus to next ayah
      if (targetAyahNumber < ayahs.length) {
        currentFocusAyahRef.current = targetAyahNumber + 1
        // Auto-scroll to the next ayah
        setTimeout(() => {
          const nextAyahElement = ayahRefsRef.current[targetAyahNumber + 1]
          if (nextAyahElement && contentContainerRef.current) {
            nextAyahElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
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
          setMatchedWords(new Map()) // Clear matched words on start
          lastProcessedResultIndexRef.current = -1 // Reset result index tracking
          previousTranscriptRef.current = '' // Reset previous transcript tracking
          // DON'T reset passedAyahs - they should persist during this session
          // If passedAyahs is empty, start from ayah 1
          currentFocusAyahRef.current = passedAyahs.length > 0 ? Math.max(...passedAyahs) + 1 : 1
          accumulatedTextRef.current = ''
          console.log(`🎤 Started recording, current passed: ${passedAyahs.length}, focusing on ayah ${currentFocusAyahRef.current}`)
        }

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''
          let hasFinalResult = false

          // Process all results
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
              hasFinalResult = true
            } else {
              interimTranscript += transcript
            }
          }

          const fullText = finalTranscript + interimTranscript
          setRecognizedText(fullText)
          
          // Process if there's new interim OR if there's a final result
          if (hasFinalResult || event.resultIndex > lastProcessedResultIndexRef.current) {
            lastProcessedResultIndexRef.current = event.resultIndex
            
            // Extract new words that weren't in previous transcript
            const previousWords = previousTranscriptRef.current.trim().split(/\s+/).filter(w => w.length > 0)
            const currentWords = fullText.trim().split(/\s+/).filter(w => w.length > 0)
            
            // Process ALL new words immediately for real-time display
            for (let i = previousWords.length; i < currentWords.length; i++) {
              const newWord = currentWords[i]
              matchRecognizedText(newWord)
            }
            
            // Update previous transcript for next comparison
            previousTranscriptRef.current = fullText
          }
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
  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
      setHighlightedAyahs(new Set()) // Clear all highlights when stopping mic
      setMatchedWords(new Map()) // Clear matched words
      setRecognizedText('') // Clear recognized text display
      
      // Save session progress if in memorize mode
      if (isMemorizeMode && passedAyahs.length > 0 && surah) {
        try {
          await readingAPI.saveSessionMemorization(surah.number, passedAyahs)
          console.log(`💾 Session memorization saved when stopping recording: ${passedAyahs.length} ayahs`)
        } catch (error) {
          console.error('Failed to save session memorization:', error)
        }
      }
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
                    {/* Tajweed colors disabled for now */}
                    <p className={`text-right text-2xl leading-relaxed font-semibold mb-4 ${quranFont === 'tajweed' ? '' : 'text-gray-800'}`} style={{fontFamily: getQuranFontFamily()}}>
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
        <div 
          ref={contentContainerRef}
          className="bg-white rounded-lg p-12 shadow-md border border-gray-100"
        >
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
              style={{ fontFamily: getQuranFontFamily(), direction: 'rtl', fontSize: `${fontSize}px`, lineHeight: '2.5' }}
            >
              {ayahs.map((ayah, index) => {
                // Use the same normalization as matching function
                const ayahWords = normalizeArabic(ayah.text).split(' ').filter(w => w.length > 0)
                const matchedWordsForAyah = matchedWords.get(ayah.numberInSurah) || new Set()
                const isAyahPassed = passedAyahs.includes(ayah.numberInSurah)
                const isAyahHighlighted = highlightedAyahs.has(ayah.numberInSurah)

                return (
                  <span
                    key={ayah.number}
                    ref={(el) => {
                      if (el) ayahRefsRef.current[ayah.numberInSurah] = el
                    }}
                    onContextMenu={(e) => handleAyahContextMenu(e, index)}
                    className={`inline transition-all duration-100 rounded px-1 cursor-context-menu ${quranFont === 'tajweed' ? '' : 'text-gray-800'} ${
                      currentAyahPlaying === ayah.numberInSurah && isPlaying
                        ? 'bg-yellow-300/60 text-gray-900 font-bold shadow-md'
                        : highlightedAyahs.has(ayah.numberInSurah)
                        ? 'bg-yellow-300/40 hover:bg-yellow-300/60'
                        : 'hover:bg-green-300/40'
                    }`}
                    style={{
                      direction: 'rtl',
                      padding: '0.125rem 0.25rem',
                    }}
                  >
                    {/* Word-by-word rendering for memorization mode */}
                    {isMemorizeMode ? (
                      <>
                        {ayahWords.map((word, wordIndex) => {
                          // If ayah is already passed, show it fully visible
                          if (isAyahPassed) {
                            return <span key={wordIndex}>{word} </span>
                          }
                          
                          // For current ayah being worked on, show matched words, hide others
                          const isMatched = isAyahHighlighted ? matchedWordsForAyah.has(wordIndex) : false
                          return (
                            <span
                              key={wordIndex}
                              style={{
                                color: isMatched ? 'inherit' : 'transparent',
                                textShadow: isMatched ? 'none' : '0 0 10px rgba(0, 0, 0, 0.1)',
                                transition: 'color 0.3s ease',
                              }}
                            >
                              {word}{' '}
                            </span>
                          )
                        })}
                      </>
                    ) : quranFont === 'tajweed' ? (
                      // Tajweed colors disabled for now - rendering as normal text
                      <>{ayah.text}</>
                    ) : (
                      // Regular text rendering
                      <>
                        {ayah.text.split('۞').map((part, idx) => (
                          <span key={idx}>
                            {part}
                            {idx < ayah.text.split('۞').length - 1 && (
                              <span className="inline-flex items-center justify-center mx-1 px-1 bg-amber-100 rounded-md border border-amber-400" title="Sajdah (Prostration)">
                                <span className="text-amber-700 font-bold text-lg" style={{fontSize: '1.3em', fontFamily: getQuranFontFamily()}}>۞</span>
                              </span>
                            )}
                          </span>
                        ))}
                      </>
                    )}

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
                )
              })}
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quran Font</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="quranFont"
                      value="amiri"
                      checked={quranFont === 'amiri'}
                      onChange={() => setQuranFont('amiri')}
                      className="mr-3 accent-teal-700"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Amiri (Uthmani)</p>
                      <p className="text-xs text-gray-500">Professional Quranic typeface</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="quranFont"
                      value="scheherazade"
                      checked={quranFont === 'scheherazade'}
                      onChange={() => setQuranFont('scheherazade')}
                      className="mr-3 accent-teal-700"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Scheherazade</p>
                      <p className="text-xs text-gray-500">Traditional Arabic style</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="quranFont"
                      value="tajweed"
                      checked={quranFont === 'tajweed'}
                      onChange={() => {
                        console.log('🔘 Tajweed radio clicked!')
                        setQuranFont('tajweed')
                        console.log('🔘 quranFont state set to tajweed')
                      }}
                      className="mr-3 accent-teal-700"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Tajweed (🎨 Colored)</p>
                      <p className="text-xs text-gray-500">Tajweed rules with colors</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {showMic && (
            <div className="fixed bg-white rounded-lg shadow-2xl p-6 w-80 z-40 border border-gray-200" style={{ bottom: '80px', right: '100px', marginBottom: '24px' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-teal-700">Voice Recording</h3>
                  {isMemorizeMode && (
                    <p className="text-xs text-purple-600 font-semibold mt-1">🧠 Memorization Mode</p>
                  )}
                </div>
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
                  
                  <button 
                    onClick={async () => {
                      console.log(`🔍 Exit button clicked - isMemorizeMode: ${isMemorizeMode}, passedAyahs: ${JSON.stringify(passedAyahs)}, surah: ${surah?.number}`)
                      
                      // Save session progress before exiting memorize mode
                      if (isMemorizeMode && passedAyahs.length > 0 && surah) {
                        try {
                          console.log(`💾 Saving ${passedAyahs.length} ayahs for surah ${surah.number}`)
                          const saveResponse = await readingAPI.saveSessionMemorization(surah.number, passedAyahs)
                          console.log(`💾 Save response:`, saveResponse)
                          console.log(`💾 Session memorization saved for ${passedAyahs.length} ayahs`)
                          
                          // Fetch updated memorization progress after saving
                          const progress = await readingAPI.getMemorizationProgress(surah.number)
                          if (progress) {
                            // setMemorizationPercentage(progress.totalPercentage || 0) // Disabled for now
                            console.log(`📊 Updated memorization percentage: ${progress.totalPercentage}%`)
                          }
                        } catch (error) {
                          console.error('Failed to save session memorization:', error)
                        }
                      } else {
                        console.log(`⚠️ Save skipped - isMemorizeMode: ${isMemorizeMode}, passedAyahs.length: ${passedAyahs.length}, hasSurah: ${!!surah}`)
                      }
                      
                      // If entering memorize mode, start recording automatically
                      if (!isMemorizeMode) {
                        setIsMemorizeMode(true)
                        // Start recording after toggling mode
                        setTimeout(() => startRecording(), 100)
                      } else {
                        // If exiting memorize mode, just toggle it
                        setIsMemorizeMode(false)
                      }
                    }}
                    className={`w-full mt-3 font-semibold py-2 px-4 rounded-lg transition ${
                      isMemorizeMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-400 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {isMemorizeMode ? '🧠 Exit Memorization Mode' : '🎤 Start Reciting Your Memories Ayat in Mic Form'}
                  </button>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-purple-700 font-semibold text-center leading-relaxed">
                      🔒 Privacy Notice: This microphone only captures the words and Ayat you speak. Your voice is not recorded for any illegal purposes. It's used solely for memorization tracking.
                    </p>
                  </div>
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