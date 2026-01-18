import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface RadioStation {
  id: number;
  name: string;
  url: string;
}

interface RadioContextType {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  playRadio: (station: RadioStation) => void;
  stopRadio: () => void;
  clearRadio: () => void;
  togglePlayPause: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: ReactNode }) {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element on mount
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      audioRef.current.addEventListener('error', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const playRadio = (station: RadioStation) => {
    if (audioRef.current) {
      // If same station, just resume
      if (currentStation?.id === station.id && audioRef.current.src) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play:', err);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      } else {
        // New station
        audioRef.current.src = station.url;
        audioRef.current.play().catch(err => {
          console.error('Failed to play:', err);
          setIsPlaying(false);
        });
        setCurrentStation(station);
        setIsPlaying(true);
      }
    }
  };

  const stopRadio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const clearRadio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentStation(null);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (currentStation) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play:', err);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    }
  };

  return (
    <RadioContext.Provider value={{ currentStation, isPlaying, playRadio, stopRadio, clearRadio, togglePlayPause }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within RadioProvider');
  }
  return context;
}
