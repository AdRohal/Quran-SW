import { useRadio } from '../providers/RadioProvider';
import { Play, Pause, X } from 'lucide-react';

export function RadioMiniPlayer() {
  const { currentStation, isPlaying, togglePlayPause, clearRadio } = useRadio();

  if (!currentStation) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 md:left-80 bg-white rounded-full shadow-2xl border border-teal-100 p-4 flex items-center gap-4 w-80 hover:shadow-3xl transition-shadow">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-xl shadow-md">
          📻
        </div>
      </div>

      {/* Station Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Now Playing</p>
        <p className="font-semibold text-gray-800 line-clamp-2 text-sm leading-tight">{currentStation.name}</p>
        
        {/* Live Indicator */}
        {isPlaying && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-500 font-bold">LIVE</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800 transition shadow-md"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white" />
          )}
        </button>
        <button
          onClick={clearRadio}
          className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
