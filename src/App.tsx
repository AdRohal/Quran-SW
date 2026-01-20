import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { RadioProvider } from './providers/RadioProvider'
import { LiveProvider } from './providers/LiveProvider'
import { Navigation } from './components/Navigation'
import { RadioMiniPlayer } from './components/RadioMiniPlayer'
import { Home } from './pages/Home'
import { Live } from './pages/Live'
import { Radio } from './pages/Radio'
import { Quran } from './pages/Quran'
import { SurahDetail } from './pages/SurahDetail'
import { Prayers } from './pages/Prayers'
import { Adkar } from './pages/Adkar'
import { Profile } from './pages/Profile'
import { Calendar } from './pages/Calendar'
import { QiblaMap } from './pages/QiblaMap'
import './index.css'

function AppContent() {
  const location = useLocation();
  const isQiblaPage = location.pathname === '/qibla';

  if (isQiblaPage) {
    return (
      <div className="relative w-full h-screen bg-white overflow-hidden">
        <Navigation />
        <main className="w-full h-screen md:ml-72 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<Live />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/quran" element={<Quran />} />
            <Route path="/quran/surah/:surahNumber" element={<SurahDetail />} />
            <Route path="/prayers" element={<Prayers />} />
            <Route path="/qibla" element={<QiblaMap />} />
            <Route path="/adkar" element={<Adkar />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <RadioMiniPlayer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Navigation />
      <main className="flex-1 md:ml-56 p-4 md:p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/quran/surah/:surahNumber" element={<SurahDetail />} />
          <Route path="/prayers" element={<Prayers />} />
          <Route path="/qibla" element={<QiblaMap />} />
          <Route path="/adkar" element={<Adkar />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <RadioMiniPlayer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <RadioProvider>
        <LiveProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </BrowserRouter>
        </LiveProvider>
      </RadioProvider>
    </AuthProvider>
  )
}

export default App
