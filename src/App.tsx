import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { Navigation } from './components/Navigation'
import { Home } from './pages/Home'
import { Live } from './pages/Live'
import { Quran } from './pages/Quran'
import { SurahDetail } from './pages/SurahDetail'
import { Prayers } from './pages/Prayers'
import { Adkar } from './pages/Adkar'
import { Profile } from './pages/Profile'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-white">
          <Navigation />
          <main className="flex-1 md:ml-56 p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/live" element={<Live />} />
              <Route path="/quran" element={<Quran />} />
              <Route path="/quran/surah/:surahNumber" element={<SurahDetail />} />
              <Route path="/prayers" element={<Prayers />} />
              <Route path="/adkar" element={<Adkar />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
