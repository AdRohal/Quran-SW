import { Sunrise, Sunset, Moon, BookOpen } from 'lucide-react';

export function Adkar() {
  const adkarCategories = [
    { title: 'Morning Adkar', icon: Sunrise, count: 24, arabic: 'أذكار الصباح' },
    { title: 'Evening Adkar', icon: Sunset, count: 18, arabic: 'أذكار المساء' },
    { title: 'Before Sleep', icon: Moon, count: 12, arabic: 'أذكار النوم' },
    { title: 'After Prayer', icon: BookOpen, count: 8, arabic: 'أذكار الصلاة' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Daily Adkar</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Strengthen your connection with Allah through daily remembrances from the Sunnah.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          {adkarCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.title}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 text-center"
              >
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-6 h-6 text-teal-700" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">{category.title}</h3>
                <p className="text-sm text-teal-700 mb-3" style={{ fontFamily: 'Amiri, serif' }}>{category.arabic}</p>
                <p className="text-xs text-gray-400">{category.count} Remembrances</p>
              </div>
            );
          })}
        </div>

        {/* Featured Supplications */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Supplications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Card - Teal background */}
            <div className="bg-teal-700 rounded-2xl p-6 text-white">
              <span className="inline-block bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded mb-4">
                Morning
              </span>
              <p 
                className="text-2xl text-right leading-relaxed mb-6" 
                style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
                dir="rtl"
              >
                اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا ، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ
              </p>
              <p className="text-white/80 italic text-sm mb-6">
                "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return."
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/70">Recite 1x</span>
                <span className="text-white/70">Sahih Al-Bukhari</span>
              </div>
            </div>

            {/* Protection Card - White background */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded mb-4">
                Protection
              </span>
              <p 
                className="text-2xl text-teal-700 text-right leading-relaxed mb-6" 
                style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
                dir="rtl"
              >
                بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ
              </p>
              <p className="text-gray-600 italic text-sm mb-6">
                "In the Name of Allah, who with His Name nothing on earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing."
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Recite 3x</span>
                <span className="text-teal-700">Abu Dawud</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
