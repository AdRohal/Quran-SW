import { useRadio } from '../providers/RadioProvider';
import { Play, Pause, X, Volume2, Radio as RadioIcon } from 'lucide-react';

export function RadioMiniPlayer() {
  const { currentStation, isPlaying, volume, togglePlayPause, clearRadio, setVolume } = useRadio();

  if (!currentStation) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 md:left-80 bg-white rounded-2xl shadow-2xl border border-teal-100 p-5 flex flex-col gap-4 w-96 hover:shadow-3xl transition-shadow">
      {/* Top Row: Thumbnail + Station Info */}
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <RadioIcon className="w-8 h-8" strokeWidth={1.5} />
          </div>
        </div>

        {/* Station Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wide">Now Playing</p>
          <p className="font-bold text-gray-900 line-clamp-2 text-base leading-snug mb-2">{currentStation.name}</p>
          
          {/* Live Indicator */}
          {isPlaying && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 font-bold uppercase tracking-wide">Live</span>
            </div>
          )}
          {!isPlaying && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Paused</span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={clearRadio}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition"
          title="Close radio player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Row: Volume + Play/Pause */}
      <div className="flex items-center gap-3">
        {/* Volume Control */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex-1">
          <Volume2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-600"
            title="Volume"
          />
          <span className="text-xs text-gray-600 font-semibold flex-shrink-0 w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition shadow-lg hover:shadow-xl"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-white" />
          ) : (
            <Play className="w-6 h-6 fill-white ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
