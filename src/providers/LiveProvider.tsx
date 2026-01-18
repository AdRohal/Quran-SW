import { useState, useRef, ReactNode } from 'react'
import { LiveContext, LiveContextType, LiveStream } from '../contexts/LiveContext'

export function LiveProvider({ children }: { children: ReactNode }) {
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullView, setIsFullView] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const playStream = (stream: LiveStream) => {
    setCurrentStream(stream)
    setIsPlaying(true)
    setIsFullView(true)
    
    // Don't play in hidden video if it's the full view player
    // The video element in Live.tsx will handle playback
  }

  const stopStream = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
    }
    setIsPlaying(false)
  }

  const clearStream = () => {
    stopStream()
    setCurrentStream(null)
    setIsFullView(false)
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <LiveContext.Provider value={{ currentStream, isPlaying, isFullView, playStream, stopStream, clearStream, togglePlayPause, setFullView: setIsFullView, videoRef }}>
      {children}
      {/* Hidden video element - only plays in mini player view */}
      {!isFullView && currentStream && (
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          crossOrigin="anonymous"
          controlsList="nodownload"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </LiveContext.Provider>
  )
}
