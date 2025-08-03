import React, { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaStepForward,
  FaStepBackward,
  FaRandom,
  FaRedoAlt,
  FaHeart,
  FaRegHeart,
  FaTimes,
  FaExpand
} from "react-icons/fa";
import styles from "./Player.module.css";
import FullscreenPlayer from "./FullscreenPlayer";
import { usePlayer } from "../context/PlayerContext";

const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    progress,
    duration,
    isLiked,
    isShuffleOn,
    isRepeatOn,
    togglePlay,
    setVolume,
    toggleMute,
    seek,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrev,
    setCurrentTrack,
  } = usePlayer();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const [isProgressDragging, setIsProgressDragging] = useState(false);

  // Проверяем размер экрана при монтировании и при изменении размера
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Обработчики для touch-событий прогресс-бара
  const handleProgressTouchStart = (e: React.TouchEvent) => {
    if (!progressBarRef.current) return;
    setIsProgressDragging(true);
    updateProgress(e.touches[0].clientX);
  };

  const handleProgressTouchMove = (e: React.TouchEvent) => {
    if (!isProgressDragging) return;
    updateProgress(e.touches[0].clientX);
  };

  const handleProgressTouchEnd = () => {
    setIsProgressDragging(false);
  };

  const updateProgress = (clientX: number) => {
    if (!progressBarRef.current) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    let position = (clientX - rect.left) / rect.width;
    position = Math.max(0, Math.min(1, position));
    const newProgress = position * duration;
    
    seek(newProgress);
    
    // Обновляем позицию ползунка
    if (progressThumbRef.current) {
      progressThumbRef.current.style.left = `${position * 100}%`;
    }
  };

  if (!currentTrack) return null;

  return (
    <>
      {isFullscreen && currentTrack && (
        <FullscreenPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onClose={() => setIsFullscreen(false)}
          togglePlay={togglePlay}
          progress={progress}
          duration={duration}
          seek={seek}
          formatTime={formatTime}
          playNext={playNext}
          playPrev={playPrev}
          isLiked={isLiked}
          toggleLike={toggleLike}
        />
      )}

      <div className={styles.playerContainer}>
        <div className={styles.playerLeft}>
          {currentTrack.cover_url && (
            <img 
              src={currentTrack.cover_url} 
              alt="cover" 
              className={styles.trackCover} 
              onClick={() => setIsFullscreen(true)}
            />
          )}
          <div className={styles.trackInfo}>
            <div className={styles.trackTitle}>{currentTrack.title}</div>
            <div className={styles.trackArtist}>{currentTrack.artist}</div>
          </div>
          {!isMobileView && (
            <button className={styles.likeBtn} onClick={toggleLike}>
              {isLiked ? <FaHeart color="#1db954" /> : <FaRegHeart />}
            </button>
          )}
        </div>

        {!isMobileView ? (
          <div className={styles.playerCenter}>
            <div className={styles.playerControls}>
              <button
                className={`${styles.controlBtn} ${isShuffleOn ? styles.active : ""}`}
                onClick={toggleShuffle}
              >
                <FaRandom />
              </button>
              <button className={styles.controlBtn} onClick={playPrev}>
                <FaStepBackward />
              </button>
              <button className={styles.playBtn} onClick={togglePlay}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className={styles.controlBtn} onClick={playNext}>
                <FaStepForward />
              </button>
              <button
                className={`${styles.controlBtn} ${isRepeatOn ? styles.active : ""}`}
                onClick={toggleRepeat}
              >
                <FaRedoAlt />
              </button>
            </div>

            <div className={styles.progressContainer}>
              <span className={styles.time}>{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration}
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                className={styles.progressBar}
              />
              <span className={styles.time}>{formatTime(duration)}</span>
            </div>
          </div>
        ) : (
          <div className={styles.mobileControls}>
            <div className={styles.mobileMainControls}>
              <button 
                className={styles.mobileControlBtn} 
                onClick={playPrev}
                aria-label="Previous track"
              >
                <FaStepBackward />
              </button>
              <button 
                className={styles.mobilePlayBtn} 
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button 
                className={styles.mobileControlBtn} 
                onClick={playNext}
                aria-label="Next track"
              >
                <FaStepForward />
              </button>
            </div>

            <div 
              className={styles.mobileProgressContainer}
              onTouchStart={handleProgressTouchStart}
              onTouchMove={handleProgressTouchMove}
              onTouchEnd={handleProgressTouchEnd}
              ref={progressBarRef}
            >
              <div 
                className={styles.mobileProgressThumb} 
                ref={progressThumbRef}
                style={{ left: `${(progress / duration) * 100}%` }}
              />
              <div 
                className={styles.mobileProgressFilled} 
                style={{ width: `${(progress / duration) * 100}%` }}
              />
              <div className={styles.mobileProgressTimes}>
                <span className={styles.mobileTime}>{formatTime(progress)}</span>
                <span className={styles.mobileTime}>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}

        {!isMobileView && (
          <div className={styles.playerRight}>
            <div className={styles.volumeControl}>
              <button className={styles.volumeBtn} onClick={toggleMute}>
                {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className={styles.volumeBar}
              />
            </div>
            <button 
              className={styles.moreBtn} 
              onClick={() => setIsFullscreen(true)}
              aria-label="Fullscreen"
            >
              <FaExpand />
            </button>
            <button 
              className={styles.closeBtn} 
              onClick={() => setCurrentTrack(null)}
              aria-label="Close player"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Player;