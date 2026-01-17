import { Home, BookOpen, Clock, Heart, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function Navigation() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'Quran', path: '/quran' },
    { icon: Clock, label: 'Prayers', path: '/prayers' },
    { icon: Heart, label: 'Adkar', path: '/adkar' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  return (
    <aside className="hidden md:block w-72 h-screen fixed left-0 top-0 p-4">
      <div className="flex flex-col h-full rounded-3xl bg-[#f2f7f4] border border-[#dbe5dd] shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-12 h-12 rounded-full bg-[#2f7f5c] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            N
          </div>
          <div>
            <h1 className="font-semibold text-[#2b5140] text-base">Nur Al-Quran</h1>
            <p className="text-xs text-[#6b8a78]">Light of the Quran</p>
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
                  isActive
                    ? 'bg-[#2f7f5c] text-white shadow'
                    : 'text-[#3f6b59] hover:bg-[#e3f0e8]'
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
          <div className="bg-gradient-to-br from-[#2d8b64] via-[#2f7e5b] to-[#1f5f46] text-white rounded-3xl p-5 shadow">
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
