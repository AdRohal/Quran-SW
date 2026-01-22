import { createContext } from 'react'

export interface LiveStream {
  id: number
  name: string
  description: string
  viewers?: number
  category?: string
  thumbnail?: string
  url?: string
  language?: string
  streamUrl?: string
}

export interface LiveContextType {
  currentStream: LiveStream | null
  isPlaying: boolean
  isFullView: boolean
  playStream: (stream: LiveStream) => void
  stopStream: () => void
  clearStream: () => void
  togglePlayPause: () => void
  setFullView: (isFull: boolean) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export const LiveContext = createContext<LiveContextType | undefined>(undefined)
