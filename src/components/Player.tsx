import React, { useState } from "react";
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
import styles from "./player.module.css";
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

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
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
          <button className={styles.likeBtn} onClick={toggleLike}>
            {isLiked ? <FaHeart color="#ff4d4d" /> : <FaRegHeart />}
          </button>
        </div>

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
          >
            <FaExpand />
          </button>
          <button className={styles.closeBtn} onClick={() => setCurrentTrack(null)}>
            <FaTimes />
          </button>
        </div>
      </div>
    </>
  );
};

export default Player;