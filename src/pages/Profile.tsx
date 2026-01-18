import { useState } from 'react';
import { Bell, Lock, Moon, Share2, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';

type ViewType = 'main' | 'edit' | 'notifications' | 'privacy' | 'appearance';

export function Profile() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [formData, setFormData] = useState({
    name: 'Ahmed Abdullah',
    email: 'ahmed@example.com',
    bio: 'Striving to memorize the Quran. Currently focusing on Juz Amma.',
  });

  const handleGoBack = () => setCurrentView('main');

  // Edit Profile View
  if (currentView === 'edit') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Edit Profile</h1>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleGoBack}
                  className="flex-1 bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleGoBack}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Notifications View
  if (currentView === 'notifications') {
    const [notifications, setNotifications] = useState({
      prayerAlerts: true,
      dailyReminders: true,
      achievementNotifications: false,
      weeklyReport: true,
    });

    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Notification Settings</h1>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {key === 'prayerAlerts' && 'Prayer Alerts'}
                      {key === 'dailyReminders' && 'Daily Reminders'}
                      {key === 'achievementNotifications' && 'Achievement Notifications'}
                      {key === 'weeklyReport' && 'Weekly Report'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {key === 'prayerAlerts' && 'Get notified for prayer times'}
                      {key === 'dailyReminders' && 'Daily reminder to read Quran'}
                      {key === 'achievementNotifications' && 'Notifications for unlocked achievements'}
                      {key === 'weeklyReport' && 'Receive weekly progress report'}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [key]: !enabled })}
                    className={`w-12 h-7 rounded-full transition flex items-center ${
                      enabled ? 'bg-teal-700' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transition transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Privacy & Security View
  if (currentView === 'privacy') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="space-y-6 max-w-2xl">
            {/* Change Password */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <button className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition mt-4">
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
              <button className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition">
                Enable 2FA
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Sessions</h2>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows', location: 'New York, USA', current: true },
                  { device: 'Safari on iPhone', location: 'New York, USA', current: false },
                ].map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{session.device}</p>
                      <p className="text-sm text-gray-500">{session.location}</p>
                    </div>
                    <div className="text-right">
                      {session.current && <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full">Current</span>}
                      {!session.current && <button className="text-red-600 text-sm font-semibold hover:underline">Sign Out</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Appearance View
  if (currentView === 'appearance') {
    const [theme, setTheme] = useState('light');
    const [textSize, setTextSize] = useState('medium');

    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Appearance Settings</h1>

            {/* Theme */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Theme</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', icon: '☀️' },
                  { id: 'dark', label: 'Dark', icon: '🌙' },
                  { id: 'auto', label: 'Auto', icon: '⚙️' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`p-4 rounded-lg border-2 transition text-center ${
                      theme === option.id
                        ? 'border-teal-700 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <p className="font-semibold text-gray-800">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Text Size</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'small', label: 'Small', size: 'text-sm' },
                  { id: 'medium', label: 'Medium', size: 'text-base' },
                  { id: 'large', label: 'Large', size: 'text-lg' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTextSize(option.id)}
                    className={`p-4 rounded-lg border-2 transition text-center ${
                      textSize === option.id
                        ? 'border-teal-700 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-semibold text-gray-800 ${option.size}`}>{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 relative">
                <span className="text-4xl">👤</span>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-xs">⭐</div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{formData.name}</h1>
                  <span className="bg-yellow-300 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Gold Member</span>
                </div>
                <p className="text-teal-100 text-sm mt-2">{formData.bio}</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('edit')}
              className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { icon: '📖', label: 'Surahs Memorized', value: '12' },
            { icon: '📅', label: 'Prayer Streak', value: '15 Days' },
            { icon: '🏆', label: 'Points Earned', value: '2,450' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Achievements & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Achievements */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Achievements</h2>
            <div className="space-y-4">
              {[
                { title: '7 Day Streak', desc: 'Maintained daily prayers for a week' },
                { title: '7 Day Streak', desc: 'Maintained daily prayers for a week' },
                { title: '7 Day Streak', desc: 'Maintained daily prayers for a week' },
              ].map((achievement, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏅</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{achievement.title}</p>
                      <p className="text-sm text-gray-500">{achievement.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
            <div className="space-y-3">
              {[
                { icon: Bell, label: 'Notifications', desc: 'Prayer alerts and daily reminders', view: 'notifications' as ViewType },
                { icon: Lock, label: 'Privacy & Security', desc: 'Account security and data', view: 'privacy' as ViewType },
                { icon: Moon, label: 'Appearance', desc: 'Dark mode and theme settings', view: 'appearance' as ViewType },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentView(item.view)}
                    className="w-full bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-teal-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
              
              {/* Sign Out Button */}
              <button className="w-full bg-white rounded-xl p-5 shadow-sm border border-red-100 hover:bg-red-50 transition flex items-center justify-between text-left mt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="font-semibold text-red-600">Sign Out</p>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
