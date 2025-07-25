import React, { useState } from "react"; 
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

  const handleLikeClick = () => {
    setIsAnimating(true);
    toggleLike();
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className={styles.fullscreenPlayer}>
      <div className={styles.fullscreenContent}>
        <div className={styles.coverContainer}>
          <img 
            src={track.cover_url} 
            alt="cover" 
            className={styles.fullscreenCover} 
          />
          
          <div className={styles.controlsOverlay}>
            <button 
              className={styles.controlBtnOverlay} 
              onClick={playPrev}
              aria-label="Previous track"
            >
              <FaStepBackward />
            </button>
            
            <button 
              className={`${styles.controlBtnOverlay} ${styles.playBtnOverlay}`} 
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            
            <button 
              className={styles.controlBtnOverlay} 
              onClick={playNext}
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
            className={`${styles.favoriteBtnFullscreen} ${isAnimating ? styles.liked : ''}`}
            onClick={handleLikeClick}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            {isLiked ? <FaHeart color="#ff4d4d" /> : <FaRegHeart />}
          </button>
        </div>
        
        <div className={styles.fullscreenTrackInfo}>
          <h2>{track.title}</h2>
          <p>{track.artist}</p>
        </div>
        
        <div className={styles.fullscreenProgressContainer}>
          <span className={styles.time}>{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className={styles.fullscreenProgressBar}
            aria-label="Track progress"
          />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPlayer;
