import { useState, useEffect } from 'react';
import { Sunrise, Sunset, Moon, BookOpen, ArrowLeft, RotateCcw } from 'lucide-react';

interface Zikr {
  id: number;
  text: string;
  count: number;
  audio?: string;
  filename?: string;
}

interface AdkarCategory {
  id: number;
  category: string;
  audio?: string;
  filename?: string;
  array: Zikr[];
}

type CategoryKey = 'morning' | 'evening' | 'sleep' | 'after_prayer';
type TimeOfDay = 'morning' | 'evening' | 'night' | 'after_prayer';

const CATEGORY_MAP: Record<CategoryKey, { title: string; icon: typeof Sunrise; arabic: string; apiId: number }> = {
  morning: { title: 'Morning Adkar', icon: Sunrise, arabic: 'أذكار الصباح', apiId: 1 },
  evening: { title: 'Evening Adkar', icon: Sunset, arabic: 'أذكار المساء', apiId: 2 },
  sleep: { title: 'Before Sleep', icon: Moon, arabic: 'أذكار النوم', apiId: 3 },
  after_prayer: { title: 'After Prayer', icon: BookOpen, arabic: 'أذكار الصلاة', apiId: 4 },
};

// Protection supplications for daily rotation
const PROTECTION_SUPPLICATIONS = [
  {
    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    translation: 'In the Name of Allah, who with His Name nothing on earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
    source: 'Abu Dawud',
    count: 3
  },
  {
    text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    translation: 'I seek refuge in the Perfect Words of Allah from the evil of what He has created.',
    source: 'At-Tirmidhi',
    count: 3
  }
];

export function Adkar() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [adkarData, setAdkarData] = useState<Zikr[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedCounts, setCompletedCounts] = useState<Record<number, number>>({});
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('morning');
  const [protectionIndex, setProtectionIndex] = useState(0);

  // Determine time of day based on current hour
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      let timeOfDay: TimeOfDay;
      
      if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'evening';
      } else if (hour >= 17 && hour < 21) {
        timeOfDay = 'evening';
      } else {
        timeOfDay = 'night';
      }
      
      setCurrentTimeOfDay(timeOfDay);
      
      // Update protection index based on time (2 times per day: morning half and evening half)
      if (hour >= 5 && hour < 16) {
        setProtectionIndex(0);
      } else {
        setProtectionIndex(1);
      }
    };
    
    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAdkar = async (category: CategoryKey) => {
    setLoading(true);
    setError(null);
    try {
      // Using hisnmuslim API 
      const categoryIds: Record<CategoryKey, number> = {
        morning: 27,
        evening: 28,
        sleep: 29,
        after_prayer: 25,
      };
      
      const response = await fetch(`https://www.hisnmuslim.com/api/ar/${categoryIds[category]}.json`);
      
      if (!response.ok) {
        // If API fails, use fallback data
        throw new Error('API unavailable');
      }
      
      const data = await response.json();
      
      const formattedData: Zikr[] = data.map((item: any, index: number) => ({
        id: index + 1,
        text: item.ARABIC_TEXT || item.TEXT || item.content,
        count: parseInt(item.REPEAT) || 1,
      }));
      
      setAdkarData(formattedData);
      setCompletedCounts({});
    } catch (err: any) {
      // Use fallback hardcoded data
      const fallbackData: Record<CategoryKey, Zikr[]> = {
        morning: [
          { id: 1, text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1 },
          { id: 2, text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', count: 1 },
          { id: 3, text: 'اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلا أَنْتَ', count: 1 },
          { id: 4, text: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللهُ لاَ إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ', count: 4 },
          { id: 5, text: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ', count: 1 },
          { id: 6, text: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ', count: 3 },
          { id: 7, text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ', count: 3 },
          { id: 8, text: 'حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', count: 7 },
          { id: 9, text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي', count: 1 },
          { id: 10, text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', count: 3 },
          { id: 11, text: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا', count: 3 },
          { id: 12, text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', count: 100 },
        ],
        evening: [
          { id: 1, text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1 },
          { id: 2, text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', count: 1 },
          { id: 3, text: 'اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلا أَنْتَ', count: 1 },
          { id: 4, text: 'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللهُ لاَ إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ', count: 4 },
          { id: 5, text: 'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ', count: 1 },
          { id: 6, text: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ', count: 3 },
          { id: 7, text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ', count: 3 },
          { id: 8, text: 'حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', count: 7 },
          { id: 9, text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', count: 3 },
          { id: 10, text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', count: 3 },
        ],
        sleep: [
          { id: 1, text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', count: 1 },
          { id: 2, text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', count: 3 },
          { id: 3, text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ', count: 1 },
          { id: 4, text: 'اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ', count: 1 },
          { id: 5, text: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ', count: 1 },
          { id: 6, text: 'سُبْحَانَ اللَّهِ', count: 33 },
          { id: 7, text: 'الْحَمْدُ لِلَّهِ', count: 33 },
          { id: 8, text: 'اللَّهُ أَكْبَرُ', count: 34 },
        ],
        after_prayer: [
          { id: 1, text: 'أَسْتَغْفِرُ اللَّهَ', count: 3 },
          { id: 2, text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', count: 1 },
          { id: 3, text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ', count: 1 },
          { id: 4, text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ، وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ، لَا إِلَهَ إِلَّا اللَّهُ مُخْلِصِينَ لَهُ الدِّينَ وَلَوْ كَرِهَ الْكَافِرُونَ', count: 1 },
          { id: 5, text: 'سُبْحَانَ اللَّهِ', count: 33 },
          { id: 6, text: 'الْحَمْدُ لِلَّهِ', count: 33 },
          { id: 7, text: 'اللَّهُ أَكْبَرُ', count: 33 },
          { id: 8, text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1 },
        ],
      };
      
      setAdkarData(fallbackData[category]);
      setCompletedCounts({});
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: CategoryKey) => {
    setSelectedCategory(category);
    fetchAdkar(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setAdkarData([]);
    setCompletedCounts({});
  };

  const handleIncrement = (id: number, maxCount: number) => {
    setCompletedCounts(prev => {
      const current = prev[id] || 0;
      if (current < maxCount) {
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  const handleReset = (id: number) => {
    setCompletedCounts(prev => ({ ...prev, [id]: 0 }));
  };

  // Detail View
  if (selectedCategory) {
    const categoryInfo = CATEGORY_MAP[selectedCategory];
    const IconComponent = categoryInfo.icon;
    
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{categoryInfo.title}</h1>
                <p className="text-teal-700" style={{ fontFamily: 'Amiri, serif' }}>{categoryInfo.arabic}</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-700 border-t-transparent"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => fetchAdkar(selectedCategory)}
                className="bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Adkar List */}
          {!loading && !error && (
            <div className="space-y-4">
              {adkarData.map((zikr, index) => {
                const completed = completedCounts[zikr.id] || 0;
                const isCompleted = completed >= zikr.count;
                
                return (
                  <div
                    key={zikr.id}
                    className={`bg-white rounded-2xl p-6 shadow-sm border transition ${
                      isCompleted ? 'border-teal-300 bg-teal-50/50' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-700 rounded-full text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReset(zikr.id)}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                          title="Reset count"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <p 
                      className="text-xl text-gray-800 text-right leading-loose mb-4" 
                      style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
                      dir="rtl"
                    >
                      {zikr.text}
                    </p>
                    
                    {/* Counter */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className={`text-sm font-medium ${isCompleted ? 'text-teal-700' : 'text-gray-500'}`}>
                        {isCompleted ? '✓ Completed' : `Recite ${zikr.count}x`}
                      </span>
                      
                      <button
                        onClick={() => handleIncrement(zikr.id, zikr.count)}
                        disabled={isCompleted}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition ${
                          isCompleted
                            ? 'bg-teal-100 text-teal-700 cursor-default'
                            : 'bg-teal-700 text-white hover:bg-teal-800'
                        }`}
                      >
                        <span className="text-lg">{completed}</span>
                        <span className="text-sm">/ {zikr.count}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main View
  const categories: { key: CategoryKey; count: number }[] = [
    { key: 'morning', count: 24 },
    { key: 'evening', count: 18 },
    { key: 'sleep', count: 12 },
    { key: 'after_prayer', count: 8 },
  ];

  return (
    <div className="min-h-screen">
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
          {categories.map(({ key, count }) => {
            const { title, icon: IconComponent, arabic } = CATEGORY_MAP[key];
            return (
              <div
                key={key}
                onClick={() => handleCategoryClick(key)}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 text-center"
              >
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-6 h-6 text-teal-700" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-teal-700 mb-3" style={{ fontFamily: 'Amiri, serif' }}>{arabic}</p>
                <p className="text-xs text-gray-400">{count} Remembrances</p>
              </div>
            );
          })}
        </div>

        {/* Featured Supplications */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Supplications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time-based Adkar Card */}
            {currentTimeOfDay === 'morning' && (
              <div className="bg-yellow-600 rounded-2xl p-6 text-white">
                <span className="inline-block bg-yellow-700 text-white text-xs font-semibold px-3 py-1 rounded mb-4">
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
            )}
            
            {currentTimeOfDay === 'evening' && (
              <div className="bg-orange-600 rounded-2xl p-6 text-white">
                <span className="inline-block bg-orange-700 text-white text-xs font-semibold px-3 py-1 rounded mb-4">
                  Evening
                </span>
                <p 
                  className="text-2xl text-right leading-relaxed mb-6" 
                  style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
                  dir="rtl"
                >
                  اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ
                </p>
                <p className="text-white/80 italic text-sm mb-6">
                  "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the return."
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">Recite 1x</span>
                  <span className="text-white/70">Sahih Al-Bukhari</span>
                </div>
              </div>
            )}
            
            {currentTimeOfDay === 'night' && (
              <div className="bg-indigo-700 rounded-2xl p-6 text-white">
                <span className="inline-block bg-indigo-800 text-white text-xs font-semibold px-3 py-1 rounded mb-4">
                  Night
                </span>
                <p 
                  className="text-2xl text-right leading-relaxed mb-6" 
                  style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
                  dir="rtl"
                >
                  بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا
                </p>
                <p className="text-white/80 italic text-sm mb-6">
                  "By Your Name, O Allah, I die and I live."
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">Recite before sleep</span>
                  <span className="text-white/70">Sahih Al-Bukhari</span>
                </div>
              </div>
            )}

            {/* Protection Card - Rotates Daily */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded mb-4">
                Protection (Day {protectionIndex === 0 ? '1' : '2'})
              </span>
              <p 
                className="text-2xl text-teal-700 text-right leading-relaxed mb-6" 
                style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
                dir="rtl"
              >
                {PROTECTION_SUPPLICATIONS[protectionIndex].text}
              </p>
              <p className="text-gray-600 italic text-sm mb-6">
                "{PROTECTION_SUPPLICATIONS[protectionIndex].translation}"
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Recite {PROTECTION_SUPPLICATIONS[protectionIndex].count}x</span>
                <span className="text-teal-700">{PROTECTION_SUPPLICATIONS[protectionIndex].source}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
