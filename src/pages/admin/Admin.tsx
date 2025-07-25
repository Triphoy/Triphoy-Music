import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.css';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.email !== 'roomop86@gmail.com') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchTracks = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (err) {
      setError('Failed to load tracks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const deleteTrack = async (track: any) => {
    const confirm = window.confirm(`Delete "${track.title}"?`);
    if (!confirm) return;

    setLoading(true);
    setError('');

    try {
      const { error: audioErr } = await supabase.storage
        .from('music')
        .remove([track.url]);
      if (audioErr) throw audioErr;

      if (track.cover_url) {
        const coverPath = track.cover_url.split('/').slice(-2).join('/');
        const { error: coverErr } = await supabase.storage
          .from('covers')
          .remove([coverPath]);
        if (coverErr) throw coverErr;
      }

      const { error: dbErr } = await supabase
        .from('tracks')
        .delete()
        .eq('id', track.id);
      if (dbErr) throw dbErr;

      setTracks(prev => prev.filter(t => t.id !== track.id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete track');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Music Admin</h1>
      </div>

      {error && (
        <div className={styles.errorState}>
          {error}
        </div>
      )}

      <div className={styles.contentBlock}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading tracks...</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No tracks found</p>
          </div>
        ) : (
          <div className={styles.trackList}>
            {tracks.map((track) => (
              <div key={track.id} className={styles.trackItem}>
                {track.cover_url ? (
                  <img 
                    src={track.cover_url} 
                    alt="Cover" 
                    className={styles.trackCover}
                  />
                ) : (
                  <div className={styles.trackCover}>🎵</div>
                )}
                
                <div className={styles.trackInfo}>
                  <div className={styles.trackTitle}>{track.title}</div>
                  <div className={styles.trackMeta}>
                    <span>{track.artist}</span>
                    <span>{track.genre}</span>
                    <span>Uploaded by: {track.user_id}</span>
                  </div>
                </div>
                
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => deleteTrack(track)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;