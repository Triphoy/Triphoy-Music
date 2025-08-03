import React, { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaCompress,
  FaHeart,
  FaRegHeart
} from "react-icons/fa";
import styles from "./fullscreen-player.module.css";

interface Track {
  id: number;
  title: string;
  artist: string;
  genre?: string;
  mood?: string;
  explicit?: boolean;
  url: string;
  cover_url?: string;
}

interface FullscreenPlayerProps {
  track: Track;
  isPlaying: boolean;
  onClose: () => void;
  togglePlay: () => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
  formatTime: (time: number) => string;
  playNext: () => void;
  playPrev: () => void;
  isLiked: boolean;
  toggleLike: () => void;
}

const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  track,
  isPlaying,
  onClose,
  togglePlay,
  progress,
  duration,
  seek,
  formatTime,
  playNext,
  playPrev,
  isLiked,
  toggleLike
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const coverRef = useRef<HTMLImageElement>(null);

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Анимация вращения обложки при воспроизведении
  useEffect(() => {
    if (!coverRef.current) return;
    
    if (isPlaying) {
      coverRef.current.style.animation = `${styles.rotate} 20s linear infinite`;
    } else {
      coverRef.current.style.animation = 'none';
    }
  }, [isPlaying]);

  const handleLikeClick = () => {
    setIsAnimating(true);
    toggleLike();
    setTimeout(() => setIsAnimating(false), 800);
  };

  // Обработчики для touch-событий прогресс-бара
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateProgress(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    updateProgress(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateProgress(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateProgress(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateProgress = (clientX: number) => {
    if (!progressBarRef.current) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    let position = (clientX - rect.left) / rect.width;
    position = Math.max(0, Math.min(1, position));
    const newProgress = position * duration;
    
    seek(newProgress);
  };

  // Анимация нажатия кнопок
  const animateButton = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.add(styles.buttonClick);
    setTimeout(() => target.classList.remove(styles.buttonClick), 300);
  };

  return (
    <div 
      className={styles.fullscreenPlayer}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className={styles.fullscreenContent}>
        <div className={styles.coverContainer}>
          <img 
            ref={coverRef}
            src={track.cover_url} 
            alt="cover" 
            className={styles.fullscreenCover} 
          />
          
          <div className={styles.controlsOverlay}>
            <button 
              className={styles.controlBtnOverlay} 
              onClick={(e) => {
                playPrev();
                animateButton(e);
              }}
              aria-label="Previous track"
            >
              <FaStepBackward />
            </button>
            
            <button 
              className={`${styles.controlBtnOverlay} ${styles.playBtnOverlay}`} 
              onClick={(e) => {
                togglePlay();
                animateButton(e);
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            
            <button 
              className={styles.controlBtnOverlay} 
              onClick={(e) => {
                playNext();
                animateButton(e);
              }}
              aria-label="Next track"
            >
              <FaStepForward />
            </button>
          </div>
          
          <button 
            className={styles.closeFullscreenBtn} 
            onClick={onClose}
            aria-label="Exit fullscreen"
          >
            <FaCompress />
          </button>
          
          <button 
            className={`${styles.favoriteBtnFullscreen} ${isLiked ? styles.liked : ''} ${isAnimating ? styles.animating : ''}`}
            onClick={handleLikeClick}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
        
        <div className={styles.fullscreenTrackInfo}>
          <h2>{track.title}</h2>
          <p>{track.artist}</p>
          {track.genre && <span className={styles.trackMeta}>{track.genre}</span>}
          {track.mood && <span className={styles.trackMeta}>{track.mood}</span>}
          {track.explicit && <span className={styles.explicitBadge}>EXPLICIT</span>}
        </div>
        
        <div 
          className={styles.fullscreenProgressContainer}
          ref={progressBarRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <span className={styles.time}>{formatTime(progress)}</span>
          <div className={styles.progressBarTrack}>
            <div 
              className={styles.progressBarFilled} 
              style={{ width: `${(progress / duration) * 100}%` }}
            >
              <div 
                className={styles.progressBarThumb}
                style={{ left: `${(progress / duration) * 100}%` }}
              />
            </div>
          </div>
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPlayer;