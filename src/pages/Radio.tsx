import { useState, useEffect } from 'react';
import { Play, Volume2, Users, Loader, Search } from 'lucide-react';
import { useRadio } from '../providers/RadioProvider';

interface RadioStation {
  id: number;
  name: string;
  url: string;
}

export function Radio() {
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentStation, isPlaying, playRadio, stopRadio } = useRadio();

  useEffect(() => {
    fetchRadios();
  }, []);

  const fetchRadios = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://mp3quran.net/api/v3/radios?language=eng');
      
      if (!response.ok) {
        throw new Error('Failed to fetch radios');
      }
      
      const data = await response.json();
      
      if (data.radios && Array.isArray(data.radios)) {
        setRadios(data.radios);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Failed to fetch radios:', err);
      // Fallback radios
      const fallbackRadios: RadioStation[] = [
        {
          id: 1,
          name: 'Quran Radio - Abd Al-Basit',
          url: 'https://Qurango.net/radio/abdulbasit',
        },
        {
          id: 2,
          name: 'Quran Radio - Mishary Rashid',
          url: 'https://Qurango.net/radio/mishary',
        },
        {
          id: 3,
          name: 'Radio Al-Azain',
          url: 'https://Qurango.net/radio/alzain',
        },
        {
          id: 4,
          name: 'Islamic Teachings Radio',
          url: 'https://Qurango.net/radio/islamic',
        },
      ];
      setRadios(fallbackRadios);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRadio = (radio: RadioStation) => {
    if (currentStation?.id === radio.id && isPlaying) {
      // Stop playing
      stopRadio();
    } else {
      // Play new radio
      playRadio(radio);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 md:px-12 lg:px-16 py-6">
        {/* Header with Search */}
        <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10 mb-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-teal-700 mb-1">Islamic Radio</h1>
              <p className="text-teal-700">Listen to Quranic recitations and teachings</p>
            </div>
            <div className="relative flex-shrink-0 w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by station name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-700 border-t-transparent"></div>
          </div>
        )}

        {/* Radio Stations Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {radios.filter(radio => 
              radio.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((radio) => (
              <div
                key={radio.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-100 group"
              >
                {/* Header */}
                <div className="relative aspect-video bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center overflow-hidden">
                  <div className="text-8xl group-hover:scale-110 transition transform">📻</div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                    <button 
                      onClick={() => handlePlayRadio(radio)}
                      className="bg-white/90 text-teal-700 p-4 rounded-full hover:bg-white transition shadow-lg"
                    >
                      {currentStation?.id === radio.id && isPlaying ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <div className="w-1 h-6 bg-teal-700 rounded-full mx-0.5 animate-pulse"></div>
                          <div className="w-1 h-4 bg-teal-700 rounded-full mx-0.5 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-6 bg-teal-700 rounded-full mx-0.5 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <Play className="w-8 h-8 fill-current" />
                      )}
                    </button>
                  </div>

                  {/* Live Indicator (if playing) */}
                  {currentStation?.id === radio.id && isPlaying && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      ON AIR
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-3 line-clamp-2 h-14">{radio.name}</h3>
                  
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayRadio(radio)}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                      currentStation?.id === radio.id && isPlaying
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-teal-700 text-white hover:bg-teal-800'
                    }`}
                  >
                    {currentStation?.id === radio.id && isPlaying ? (
                      <>
                        <Volume2 className="w-5 h-5" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        Play
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && radios.length === 0 && (
          <div className="text-center py-20">
            <Volume2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No radio stations available</p>
          </div>
        )}
      </div>
    </div>
  );
}
