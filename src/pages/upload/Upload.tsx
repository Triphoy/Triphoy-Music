// src/pages/Upload.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

const GENRES = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Trap",
  "Electronic",
  "R&B",
  "Jazz",
  "Classical",
  "Blues",
  "Metal",
  "Country",
  "Reggae",
  "Funk",
  "Soul",
  "Disco",
  "House",
  "Techno",
  "Dubstep",
  "Ambient",
  "Indie",
  "Alternative",
  "Folk",
  "Latin",
  "Other",
];

const MOODS = [
  "Happy",
  "Sad",
  "Energetic",
  "Chill",
  "Romantic",
  "Angry",
  "Melancholic",
  "Hopeful",
  "Dark",
  "Uplifting",
  "Dreamy",
  "Aggressive",
  "Relaxed",
  "Party",
  "Reflective",
  "Epic",
  "Mysterious",
  "Calm",
  "Tense",
  "Other",
];

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [trackData, setTrackData] = useState({
    title: '',
    artist: '',
    featuring: '',
    genre: 'Pop',
    mood: '',
    explicit: false 
});

  
  const [files, setFiles] = useState({
    audio: null as File | null,
    cover: null as File | null,
    coverPreview: ''
  });

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching username:', error);
        // В случае ошибки подставим email или пустую строку
        setTrackData(prev => ({
          ...prev,
          artist: user.email || ''
        }));
      } else {
        setTrackData(prev => ({
          ...prev,
          artist: data?.username || user.email || ''
        }));
      }
    };

    fetchUsername();
  }, [user]);


  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio/')) {
      setError('Please upload an audio file (MP3, WAV, etc.)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Audio file should be less than 50MB');
      return;
    }

    setFiles(prev => ({ ...prev, audio: file }));
    setError('');
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Cover image should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFiles(prev => ({
        ...prev,
        cover: file,
        coverPreview: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  setSuccess('');

  try {
    if (!files.audio) throw new Error('Audio file is required');

    // 🔒 Проверка лимита загрузки
    const { data: existingTracks, error: countError } = await supabase
      .from('tracks')
      .select('id', { count: 'exact' })
      .eq('user_id', user?.id);

    if (countError) throw countError;

    const isAuthor = user?.email === "roomop86@gmail.com"; // замените на свою почту

    if (!isAuthor && existingTracks.length >= 2) {
      throw new Error('Вы можете загрузить не более 2 треков');
    }

    // 📤 Загрузка аудиофайла
    const audioExt = files.audio.name.split('.').pop();
    const audioName = `${user?.id}-${crypto.randomUUID()}.${audioExt}`;
    const audioPath = `tracks/${audioName}`;

    const { error: audioUploadError } = await supabase.storage
      .from('music')
      .upload(audioPath, files.audio);

    if (audioUploadError) throw audioUploadError;

    // 🖼️ Загрузка обложки
    let coverUrl = '';
    if (files.cover) {
      const coverExt = files.cover.name.split('.').pop();
      const coverName = `${user?.id}-${crypto.randomUUID()}.${coverExt}`;
      const coverPath = `covers/${coverName}`;

      const { error: coverUploadError } = await supabase.storage
        .from('covers')
        .upload(coverPath, files.cover);

      if (coverUploadError) throw coverUploadError;

      const { publicUrl } = supabase.storage
  .from('covers')
  .getPublicUrl(coverPath).data;

if (!publicUrl) {
  throw new Error('Не удалось получить ссылку на обложку');
}

coverUrl = publicUrl;

    }

    // 👤 Имя артиста
    const artistName = trackData.featuring
      ? `${trackData.artist} feat. ${trackData.featuring}`
      : trackData.artist;

    // 📝 Добавление трека в БД
    const { error: dbError } = await supabase
      .from('tracks')
      .insert({
        title: trackData.title,
        artist: artistName,
        genre: trackData.genre,
        mood: trackData.mood,
        explicit: trackData.explicit,
        url: audioPath,
        cover_url: coverUrl,
        user_id: user?.id
      });

    if (dbError) throw dbError;

    setSuccess('Трек успешно загружен!');
    setTrackData({
      title: '',
      artist: user?.user_metadata?.full_name || user?.user_metadata?.username || '',
      featuring: '',
      genre: 'Pop',
      mood: '',
      explicit: false
    });
    setFiles({ audio: null, cover: null, coverPreview: '' });
    setTimeout(() => navigate('/'), 2000);
  } catch (err) {
    console.error('Upload error:', err);
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Ошибка при загрузке трека');
    }
  } finally {
    setIsLoading(false);
  }
};


  if (!user) {
    return (
      <div className="upload-container">
        <h2>Upload Music</h2>
        <div className="auth-message">
          <p>You need to be logged in to upload tracks.</p>
          <button onClick={() => navigate('/login')} className="auth-button">
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-container">
      <h2>Загрузите вашу музыку</h2>
      
      <div className="upload-steps">
        <div className={`step ${step === 1 ? 'active' : ''}`}>1. Инфа о треке</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>2. Загрузка файлов</div>
      </div>

      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
          className="upload-form"
        >
          <div className="form-group">
            <label htmlFor="title">Название *</label>
            <input
              id="title"
              type="text"
              value={trackData.title}
              onChange={(e) => setTrackData({...trackData, title: e.target.value})}
              placeholder="Введите название трека"
              required
            />
          </div>

          <div className="form-group">
  <label htmlFor="artist">Имя Артиста *</label>
  <input
    id="artist"
    type="text"
    value={trackData.artist}
    readOnly
    disabled
    className="disabled-input"
  />
</div>


          <div className="form-group">
            <label htmlFor="featuring">Коллаборация (Feat)</label>
            <input
              id="featuring"
              type="text"
              value={trackData.featuring}
              onChange={(e) => setTrackData({...trackData, featuring: e.target.value})}
              placeholder="Совместное произведение, (можно оставить пустым)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="genre">Жанр *</label>
              <select
                id="genre"
                value={trackData.genre}
                onChange={(e) => setTrackData({...trackData, genre: e.target.value})}
                required
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mood">Настроение (optional)</label>
              <select
                id="mood"
                value={trackData.mood}
                onChange={(e) => setTrackData({...trackData, mood: e.target.value})}
              >
                <option value="">Нажмите для выбора</option>
                {MOODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="explicit"
              checked={trackData.explicit}
              onChange={(e) => setTrackData({...trackData, explicit: e.target.checked})}
            />
            <label htmlFor="explicit">Мой трек содержит маты</label>
          </div>

          <button type="submit" className="next-button">
            Перейти к загрузке аудиофайла
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-upload-section">
            <div className="file-upload-group">
              <h3>Аудио Файл *</h3>
              <p>Поддерживаются эти форматы: MP3, WAV, FLAC (max 50MB)</p>
              <input
                type="file"
                ref={audioInputRef}
                onChange={handleAudioChange}
                accept="audio/*"
                hidden
              />
              <button 
                type="button"
                className="file-upload-button"
                onClick={() => audioInputRef.current?.click()}
              >
                {files.audio ? files.audio.name : 'Нажмите для выбора'}
              </button>
            </div>

            <div className="file-upload-group">
              <h3>Обложка (необязательно)</h3>
              <p>Рекомендуем размер: 1500x1500px (max 5MB)</p>
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverChange}
                accept="image/*"
                hidden
              />
              <button 
                type="button"
                className="file-upload-button"
                onClick={() => coverInputRef.current?.click()}
              >
                {files.cover ? files.cover.name : 'Нажмите для выбора'}
              </button>
              
              {files.coverPreview && (
                <div className="cover-preview">
                  <img src={files.coverPreview} alt="Cover preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button"
              className="back-button"
              onClick={() => setStep(1)}
            >
              Вернуться к данным
            </button>
            
            <button 
              type="submit" 
              className="upload-button"
              disabled={isLoading || !files.audio}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Загрузка...
                </>
              ) : 'Загрузить трек'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default Upload;
