import { useState, useEffect, useRef } from 'react';
import { Play, Radio, Users, Clock, X, Search } from 'lucide-react';
import { useLive } from '../hooks/useLive';

interface LiveStream {
  id: number;
  name: string;
  description: string;
  viewers?: number;
  category?: string;
  thumbnail?: string;
  url?: string;
  language?: string;
  streamUrl?: string;
}

export function Live() {
  const { currentStream, isPlaying, playStream, clearStream, setFullView } = useLive();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Clear the current stream when entering Live page to always show grid view
    clearStream();
  }, []);

  useEffect(() => {
    // Set full view when on Live page
    setFullView(true);
    return () => setFullView(false);
  }, [setFullView]);

  useEffect(() => {
    fetchMakkahLiveStreams();
  }, []);

  const fetchMakkahLiveStreams = async () => {
    setLoading(true);
    try {
      // Fetch from mp3quran.net live TV API
      const response = await fetch('https://mp3quran.net/api/v3/live-tv?language=eng');
      
      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }
      
      const data = await response.json();
      
      if (data.livetv && Array.isArray(data.livetv)) {
        const formattedStreams: LiveStream[] = data.livetv.map((channel: any, idx: number) => {
          let thumbnail = '🕌';
          if (channel.name.toLowerCase().includes('quran')) {
            thumbnail = 'quran-tv';
          } else if (channel.name.toLowerCase().includes('sunna')) {
            thumbnail = 'sunna-tv';
          }
          return {
            id: channel.id || idx + 1,
            name: channel.name || `Live Stream ${idx + 1}`,
            description: `${channel.name} - Live broadcast from Islamic channels`,
            viewers: Math.floor(Math.random() * 30000) + 10000,
            category: 'Makkah & Madinah',
            thumbnail: thumbnail,
            language: 'Arabic',
            streamUrl: channel.url,
            url: channel.url,
          };
        });
        setStreams(formattedStreams);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Failed to fetch live streams:', err);
      // Fallback with known channels
      const fallbackStreams: LiveStream[] = [
        {
          id: 1,
          name: 'Quran Channel',
          description: 'Quran Channel - Continuous Quranic recitation',
          viewers: 32000,
          category: 'Makkah & Madinah',
          thumbnail: 'quran-tv',
          language: 'Arabic',
          streamUrl: 'https://win.holol.com/live/quran/playlist.m3u8',
          url: 'https://win.holol.com/live/quran/playlist.m3u8',
        },
        {
          id: 2,
          name: 'Sunna Channel',
          description: 'Sunna Channel - Islamic teachings and Hadith',
          viewers: 28000,
          category: 'Makkah & Madinah',
          thumbnail: 'sunna-tv',
          language: 'Arabic',
          streamUrl: 'https://win.holol.com/live/sunnah/playlist.m3u8',
          url: 'https://win.holol.com/live/sunnah/playlist.m3u8',
        },
        {
          id: 3,
          name: 'Makkah Live',
          description: 'Live broadcast from the Holy Mosque of Makkah',
          viewers: 35000,
          category: 'Makkah & Madinah',
          thumbnail: '🕌',
          language: 'Arabic',
          streamUrl: 'https://www.youtube.com/embed/czfrMAeZ7pQ',
          url: 'https://www.youtube.com/embed/czfrMAeZ7pQ',
        },
        {
          id: 4,
          name: 'Madinah Live',
          description: 'Live broadcast from the Prophet\'s Mosque in Madinah',
          viewers: 28000,
          category: 'Makkah & Madinah',
          thumbnail: '🕌',
          language: 'Arabic',
          streamUrl: 'https://www.youtube.com/embed/nQ5xF8DqaWU',
          url: 'https://www.youtube.com/embed/nQ5xF8DqaWU',
        },
      ];
      setStreams(fallbackStreams);
    } finally {
      setLoading(false);
    }
  };

  if (currentStream) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-6">
          <button
            onClick={() => clearStream()}
            className="mb-6 text-teal-700 font-semibold hover:underline flex items-center gap-2"
          >
            ← Back to Live Streams
          </button>

          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl mb-8 mx-auto" style={{ width: '70%' }}>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative group">
              {currentStream.streamUrl ? (
                <>
                  {currentStream.streamUrl.includes('youtube.com') ? (
                    <iframe
                      className="w-full h-full"
                      src={currentStream.streamUrl.replace('embed/', 'embed/') + '?autoplay=1'}
                      title={currentStream.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      autoPlay
                      controlsList="nodownload"
                    >
                      <source src={currentStream.streamUrl} type="application/x-mpegURL" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {currentStream.thumbnail && (currentStream.thumbnail === 'quran-tv' || currentStream.thumbnail === 'sunna-tv') ? (
                    <img 
                      src={`/src/public/live/${currentStream.thumbnail}.png`} 
                      alt={currentStream.name}
                      className="max-w-sm h-auto object-contain"
                    />
                  ) : (
                    <div className="text-8xl mb-6">{currentStream.thumbnail || '📺'}</div>
                  )}
                  <div className="text-white text-center">
                    <p className="text-3xl font-bold mb-3">{currentStream.name}</p>
                    <div className="flex items-center justify-center gap-2 text-green-400 text-lg">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold">LIVE</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Live Badge */}
              <div className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-800 mb-3">{currentStream.name}</h1>
                <p className="text-gray-600 text-lg mb-6">{currentStream.description}</p>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-teal-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-teal-700" />
                      <span className="text-gray-600 font-semibold text-sm">Viewers</span>
                    </div>
                    <p className="text-2xl font-bold text-teal-700">{(currentStream.viewers || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-5 h-5 text-teal-700" />
                      <span className="text-gray-600 font-semibold text-sm">Category</span>
                    </div>
                    <p className="text-2xl font-bold text-teal-700">{currentStream.category}</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-teal-700" />
                      <span className="text-gray-600 font-semibold text-sm">Language</span>
                    </div>
                    <p className="text-2xl font-bold text-teal-700">{currentStream.language}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Stream Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-green-600">Broadcasting Live</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Quality</p>
                  <span className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">HD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 md:px-12 lg:px-16 py-6">
        {/* Header with Search */}
        <div className="bg-white rounded-xl p-8 shadow-md sticky top-0 z-10 mb-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-teal-700 mb-1">Makkah Live</h1>
              <p className="text-teal-700">Watch live broadcasts from the Holy Mosque</p>
            </div>
            <div className="relative flex-shrink-0 w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by channel name..."
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

        {/* Live Streams Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.filter(stream => 
              stream.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((stream) => (
              <div
                key={stream.id}
                onClick={() => playStream(stream)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-100 group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center overflow-hidden">
                  {stream.thumbnail && (stream.thumbnail === 'quran-tv' || stream.thumbnail === 'sunna-tv') ? (
                    <img 
                      src={`/src/public/live/${stream.thumbnail}.png`} 
                      alt={stream.name}
                      className="w-2/3 h-2/3 object-contain group-hover:scale-105 transition transform"
                    />
                  ) : (
                    <div className="text-6xl group-hover:scale-110 transition transform">{stream.thumbnail || '📺'}</div>
                  )}
                  
                  {/* Live Badge */}
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                    <button className="bg-white/90 text-teal-700 p-4 rounded-full hover:bg-white transition">
                      <Play className="w-8 h-8 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{stream.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{stream.description}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{(stream.viewers || 0).toLocaleString()} watching</span>
                    </div>
                    <span className="text-teal-700 font-semibold">{stream.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
