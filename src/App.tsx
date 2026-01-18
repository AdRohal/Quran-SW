import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { RadioProvider } from './providers/RadioProvider'
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
import './index.css'

function App() {
  return (
    <AuthProvider>
      <RadioProvider>
        <BrowserRouter>
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
                <Route path="/adkar" element={<Adkar />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
            <RadioMiniPlayer />
          </div>
        </BrowserRouter>
      </RadioProvider>
    </AuthProvider>
  )
}

export default App
