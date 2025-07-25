import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Layout from "../../components/Layout";
import { useSession } from "@supabase/auth-helpers-react";
import { usePlayer } from "../../context/PlayerContext"; // импортируем хук
import cover1 from '../home/img/cover1.jpg'
import styles from "./favorite.module.css";

interface Track {
  id: number;
  title: string;
  artist: string;
  genre: string;
  url: string;
  cover_url?: string;
  duration?: number;
}

const Favorites: React.FC = () => {
  const session = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const { playTrack, setPlaylist } = usePlayer(); // достаём из контекста функцию воспроизведения и установки плейлиста

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return;

      const { data: likes, error } = await supabase
        .from("likes")
        .select("track_id")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Ошибка загрузки лайков:", error.message);
        return;
      }

      const trackIds = likes.map(like => like.track_id);

      if (trackIds.length === 0) {
        setTracks([]);
        return;
      }

      const { data: favoriteTracks, error: trackError } = await supabase
        .from("tracks")
        .select("*")
        .in("id", trackIds);

      if (trackError) {
        console.error("Ошибка загрузки треков:", trackError.message);
      } else if (favoriteTracks) {
        const formatted = favoriteTracks.map(t => ({
          ...t,
          url: `https://pkjhtwnpgllkzcqalikd.supabase.co/storage/v1/object/public/music/${t.url}`,
          cover_url: t.cover_url || ''
        }));
        setTracks(formatted);
        setPlaylist(formatted); // обязательно обновляем плейлист в контексте
      }
    };

    fetchFavorites();
  }, [session, setPlaylist]);

  const handleRemoveTrack = async (trackId: number) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", session.user.id)
        .eq("track_id", trackId);

      if (error) throw error;

      setTracks(prev => prev.filter(track => track.id !== trackId));
    } catch (error) {
      console.error("Ошибка при удалении трека:", error);
    }
  };

  const formatDuration = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Layout>
      <div className={styles.favoritesPage}>
        <div className={styles.header}>
          <h1 className={styles.title}>Избранное</h1>
        </div>

        <div className={styles.trackList}>
          {tracks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нет избранных треков</p>
            </div>
          ) : (
            tracks.map(track => (
              <div
                className={styles.trackItem}
                key={track.id}
                onClick={() => playTrack(track)} // запускаем трек при клике на карточку
                style={{ cursor: "pointer" }} // чтобы было понятно, что можно кликать
              >
                <img 
                  src={track.cover_url || cover1} 
                  alt={track.title} 
                  className={styles.trackCover}
                />
                
                <div className={styles.trackInfo}>
                  <div className={styles.trackTitle}>{track.title}</div>
                  <div className={styles.trackArtist}>{track.artist}</div>
                </div>
                
                <div className={styles.trackDuration}>
                  {formatDuration(track.duration)}
                </div>
                
                <button 
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation(); // чтобы клик по кнопке не запускал playTrack
                    handleRemoveTrack(track.id);
                  }}
                  title="Удалить из избранного"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Favorites;
