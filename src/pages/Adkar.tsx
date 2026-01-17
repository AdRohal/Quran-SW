export function Adkar() {
  const adkarCategories = [
    { title: 'Morning Adkar', icon: '🌅', count: 24, arabic: 'أذكار الصباح' },
    { title: 'Evening Adkar', icon: '🌙', count: 18, arabic: 'أذكار المساء' },
    { title: 'Before Sleep', icon: '😴', count: 12, arabic: 'أذكار النوم' },
    { title: 'After Prayer', icon: '📖', count: 8, arabic: 'أذكار الصلاة' },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0 px-4 md:px-6 lg:px-10">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h1 className="text-3xl font-bold text-[#2f7f5c] mb-2">Daily Adkar</h1>
        <p className="text-[#6b8a78]">Strengthen your connection with Allah through daily remembrances from the Sunnah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adkarCategories.map((category) => (
          <div
            key={category.title}
            className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition cursor-pointer border border-gray-100"
          >
            <p className="text-5xl mb-3">{category.icon}</p>
            <h3 className="text-xl font-bold mb-1 text-gray-800">{category.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{category.arabic}</p>
            <p className="text-[#2f7f5c] font-semibold text-lg">{category.count} Remembrances</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#e3f0e8] to-[#f0f7f3] rounded-lg p-6 border border-[#d1e3d7]">
        <h2 className="text-xl font-bold mb-4 text-[#2f7f5c]">Featured Supplications</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              category: 'Morning',
              arabic: 'اللَّهُمَّ أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
              english: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.',
              source: 'Sahih Al-Bukhari',
              recite: 'Recite 1x',
              reps: '1x',
            },
            {
              category: 'Protection',
              arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ',
              english: 'In the Name of Allah, who with His Name nothing on earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
              source: 'Abu Dawud',
              recite: 'Recite 3x',
              reps: '3x',
            },
          ].map((supp, idx) => (
            <div key={idx} className="bg-white rounded-lg p-5 shadow-md border border-[#d1e3d7]">
              <div className="inline-block bg-[#2f7f5c] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                {supp.category}
              </div>
              <p className="text-right text-xl text-[#2f7f5c] font-semibold mb-3 leading-loose">
                {supp.arabic}
              </p>
              <p className="text-gray-700 italic text-sm mb-4">{supp.english}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="font-semibold">{supp.recite}</span>
                <span>{supp.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
