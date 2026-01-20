import { Home, BookOpen, Clock, Heart, User, Radio, Navigation as NavigationIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation();
  const isQiblaPage = location.pathname === '/qibla';

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Radio, label: 'Live', path: '/live' },
    { icon: BookOpen, label: 'Quran', path: '/quran' },
    { icon: Radio, label: 'Radio', path: '/radio' },
    { icon: Clock, label: 'Prayers', path: '/prayers' },
    { icon: NavigationIcon, label: 'Qibla', path: '/qibla' },
    { icon: Heart, label: 'Adkar', path: '/adkar' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  return (
    <aside className={`w-72 h-screen fixed left-0 top-0 p-4 z-50 ${isQiblaPage ? 'block' : 'hidden md:block'}`}>
      <div className="flex flex-col h-full rounded-3xl bg-[#e9f4f1] border border-teal-100 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-12 h-12 rounded-full bg-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            N
          </div>
          <div>
            <h1 className="font-semibold text-teal-900 text-base">Nur Al-Quran</h1>
            <p className="text-xs text-teal-700">Light of the Quran</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive ? 'bg-teal-700 text-white shadow' : 'text-teal-700 hover:bg-teal-100'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Daily Goal */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 text-white rounded-3xl p-5 shadow">
            <p className="font-semibold text-lg">Daily Goal</p>
            <p className="text-sm text-white/85 mt-0.5">2/5 pages read</p>
            <div className="h-2 bg-white/25 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
