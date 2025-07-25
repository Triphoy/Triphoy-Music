// context/PlayerContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // поправь путь под свой проект

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover_url?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  isLiked: boolean;
  isShuffleOn: boolean;
  isRepeatOn: boolean;
  playlist: Track[];
  setCurrentTrack: (track: Track | null) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  toggleLike: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrev: () => void;
  setPlaylist: (playlist: Track[]) => void;
  playTrack: (track: Track) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Инициализация аудио
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      };

      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };

      const handleEnded = () => {
        if (isRepeatOn && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        } else {
          playNext();
        }
      };

      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audioRef.current.removeEventListener("ended", handleEnded);
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [isRepeatOn]);

  // Авто-воспроизведение при смене трека
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();

      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));

      setProgress(0);
    }
  }, [currentTrack]);

  // Проверяем, лайкнут ли текущий трек
  useEffect(() => {
    const checkLiked = async () => {
      if (!currentTrack) {
        setIsLiked(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setIsLiked(false);
        return;
      }

      const { data: existing, error } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_id", currentTrack.id)
        .single();

      if (!error && existing) {
        setIsLiked(true);
      } else {
        setIsLiked(false);
      }
    };

    checkLiked();
  }, [currentTrack]);

  const togglePlay = () => {
    if (!currentTrack || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const playNext = () => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (isShuffleOn) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    const nextTrack = playlist[nextIndex];
    playTrack(nextTrack);
  };

  const playPrev = () => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;

    const prevTrack = playlist[prevIndex];
    playTrack(prevTrack);
  };

  const toggleLike = async () => {
    if (!currentTrack) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) return;

    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", currentTrack.id)
      .single();

    if (existing) {
      await supabase
        .from("likes")
        .delete()
        .eq("id", existing.id);
      setIsLiked(false);
    } else {
      await supabase.from("likes").insert({
        user_id: user.id,
        track_id: currentTrack.id,
      });
      setIsLiked(true);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        isMuted,
        progress,
        duration,
        isLiked,
        isShuffleOn,
        isRepeatOn,
        playlist,
        setCurrentTrack,
        togglePlay,
        setVolume: handleVolumeChange,
        toggleMute,
        seek,
        toggleLike,
        toggleShuffle: () => setIsShuffleOn(!isShuffleOn),
        toggleRepeat: () => setIsRepeatOn(!isRepeatOn),
        playNext,
        playPrev,
        setPlaylist,
        playTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
