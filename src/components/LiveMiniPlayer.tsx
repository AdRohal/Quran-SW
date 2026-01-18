import { Play, Pause, X } from 'lucide-react'
import { useEffect } from 'react'
import { useLive } from '../hooks/useLive'

export function LiveMiniPlayer() {
  const { currentStream, isPlaying, isFullView, togglePlayPause, clearStream, videoRef } = useLive()

  // Load stream in hidden video when not in full view
  useEffect(() => {
    if (!isFullView && currentStream && videoRef.current && currentStream.streamUrl && !currentStream.streamUrl.includes('youtube.com')) {
      videoRef.current.src = currentStream.streamUrl
    }
  }, [currentStream, isFullView, videoRef])

  if (!currentStream || isFullView) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 left-6 z-40 group">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-64 hover:shadow-3xl transition-all">
        {/* Video Thumbnail */}
        <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
          {currentStream.thumbnail && (currentStream.thumbnail === 'quran-tv' || currentStream.thumbnail === 'sunna-tv') ? (
            <img 
              src={`/src/public/live/${currentStream.thumbnail}.png`} 
              alt={currentStream.name}
              className="w-2/3 h-auto object-contain"
            />
          ) : (
            <div className="text-white text-4xl">🕌</div>
          )}
          
          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800 transition"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
          </div>
        </div>

        {/* Stream Info */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-800 text-sm truncate">{currentStream.name}</h3>
          <p className="text-xs text-gray-500 truncate">Live</p>
        </div>

        {/* Close Button */}
        <button
          onClick={clearStream}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Picture in Picture Indicator */}
        {isPlaying && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-teal-700 text-white text-xs rounded-full font-semibold">
            LIVE
          </div>
        )}
      </div>
    </div>
  )
}
