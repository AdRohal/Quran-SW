export function Profile() {
  return (
    <div className="space-y-6 pb-20 md:pb-0 px-4 md:px-6 lg:px-10">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#2d8b64] via-[#2f7e5b] to-[#1f5f46] text-white rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center text-5xl border-2 border-white border-opacity-30">
            👤
          </div>
          <div>
            <h1 className="text-3xl font-bold">User Name</h1>
            <p className="text-lg opacity-90">user@example.com</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pages Read', value: '275', icon: '📖' },
            { label: 'Surahs Memorized', value: '2', icon: '✨' },
            { label: 'Streak Days', value: '5', icon: '🔥' },
            { label: 'Total Time', value: '42h', icon: '⏱️' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gradient-to-br from-[#e3f0e8] to-gray-50 p-4 rounded-xl text-center border border-[#d1e3d7]">
              <p className="text-3xl mb-2">{stat.icon}</p>
              <p className="text-3xl font-bold text-[#2f7f5c] mb-1">{stat.value}</p>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Preferences</h2>
        <div className="space-y-4">
          {[
            { label: 'Prayer Notifications', enabled: true },
            { label: 'Dark Mode', enabled: false },
            { label: 'Sound Effects', enabled: true },
            { label: 'Analytics', enabled: false },
          ].map((pref) => (
            <div key={pref.label} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <label className="font-semibold text-gray-800">{pref.label}</label>
              <div
                className={`w-12 h-7 rounded-full transition flex items-center ${
                  pref.enabled ? 'bg-[#2f7f5c]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transition transform ${
                    pref.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition shadow-md">
        Sign Out
      </button>
    </div>
  )
}
