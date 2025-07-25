import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';
import styles from './Profile.module.css';

const MAX_BIO_LENGTH = 200;

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  website: string;
  location: string;
  avatar_url: string;
}

interface FollowingUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Subscription {
  following_id: string;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Profile>({
    id: '',
    username: '',
    full_name: '',
    bio: '',
    website: '',
    location: '',
    avatar_url: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [weeklyPlays, setWeeklyPlays] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeTrim = (value: string | undefined | null) => (value ? value.trim() : '');

  const loadProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, website, location, avatar_url')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Ошибка загрузки профиля:', error);
      setErrorMsg('Не удалось загрузить профиль');
      return;
    }

    if (data) {
      setProfile(data);
      setFormData({
        id: data.id,
        username: data.username || '',
        full_name: data.full_name || '',
        bio: data.bio || '',
        website: data.website || '',
        location: data.location || '',
        avatar_url: data.avatar_url || '',
      });
    }
  };

  const loadWeeklyPlays = async () => {
    if (!user?.id) return;

    const { data: userTracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id')
      .eq('user_id', user.id);

    if (tracksError) {
      console.error('Ошибка загрузки треков:', tracksError);
      return;
    }

    if (!userTracks || userTracks.length === 0) {
      setWeeklyPlays(0);
      return;
    }

    const trackIds = userTracks.map(t => t.id);
    const weekAgo = dayjs().subtract(7, 'day').toISOString();

    const { count, error: playsError } = await supabase
      .from('track_plays')
      .select('id', { count: 'exact', head: true })
      .in('track_id', trackIds)
      .gte('played_at', weekAgo);

    if (playsError) {
      console.error('Ошибка загрузки прослушиваний:', playsError);
      return;
    }

    setWeeklyPlays(count || 0);
  };

  const loadFollowersCount = async () => {
    if (!user?.id) return;

    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    if (error) {
      console.error('Ошибка загрузки подписчиков:', error);
      return;
    }

    setFollowersCount(count || 0);
  };

const loadFollowingUsers = async () => {
  if (!user?.id) return;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('following_id, follower_id')
    .eq('follower_id', user.id);

  if (error) {
    console.error('Ошибка загрузки подписок:', error);
    return;
  }

  const subscriptions = data as Subscription[] | null;

  if (!subscriptions || subscriptions.length === 0) {
    setFollowingUsers([]);
    return;
  }

  const followingIds = subscriptions.map(sub => sub.following_id);

  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', followingIds);

  if (usersError) {
    console.error('Ошибка загрузки пользователей:', usersError);
    return;
  }

  const users = usersData as FollowingUser[] | null;

  setFollowingUsers(users ?? []);
};


  const handleSaveProfile = async () => {
    if (!safeTrim(formData.username)) {
      setErrorMsg('Требуется имя пользователя');
      return;
    }

    const updates = {
      id: user.id,
      username: safeTrim(formData.username),
      full_name: safeTrim(formData.full_name),
      bio: safeTrim(formData.bio),
      website: safeTrim(formData.website),
      location: safeTrim(formData.location),
      avatar_url: formData.avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) {
      console.error('Ошибка сохранения профиля:', error);
      setErrorMsg('Не удалось сохранить профиль');
      return;
    }

    setIsEditing(false);
    setShowSettings(false);
    loadProfile();
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      setErrorMsg('Ошибка загрузки аватара');
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id);

    setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
    loadProfile();
  };

  useEffect(() => {
    if (user) {
      loadProfile();
      loadWeeklyPlays();
      loadFollowersCount();
      loadFollowingUsers();
    }
  }, [user]);

  if (!user) return <div>Пожалуйста, войдите в систему для просмотра профиля</div>;
  if (!profile) return <div>Загрузка профиля...</div>;

  return (
    <div className={styles.profilePage}>
      <h1>Профиль</h1>
      <div className={styles.profileCard}>
        <button
          className={styles.settingsIcon}
          onClick={() => setShowSettings(prev => !prev)}
          title="Настройки профиля"
        >
          <FaCog />
        </button>

        <div className={styles.avatarSection}>
          <img
            src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.username}`}
            alt="Avatar"
            className={styles.avatar}
          />
          {isEditing && (
            <>
              <button
                className={styles.editAvatarBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Изменить аватар"
              >
                <FaEdit />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
              />
            </>
          )}
        </div>

        <div className={styles.infoSection}>
          <h2>{formData.full_name || 'Artist Name'}</h2>
          <p className={styles.role}>beatmaker</p>

          <p className={styles.stats}>
            {followersCount} подписчиков
          </p>

          <div className={styles.weekStat}>
            Вас послушали {weeklyPlays.toLocaleString()} раз за эту неделю
          </div>

          {isEditing && (
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Имя пользователя"
              className={styles.input}
            />
          )}

          {showSettings && (
            <div className={styles.settingsPanel}>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Полное имя"
                className={styles.input}
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Биография"
                maxLength={MAX_BIO_LENGTH}
                className={styles.textarea}
              />
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="Веб-сайт"
                className={styles.input}
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Местоположение"
                className={styles.input}
              />
            </div>
          )}

          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <div className={styles.actions}>
            <button onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}>
              {isEditing ? 'Сохранить' : 'Редактировать'}
            </button>
            <button onClick={logout}>
              <FaSignOutAlt /> Выйти
            </button>
          </div>
        </div>
      </div>

      {followingUsers.length > 0 && (
        <div className={styles.followingList}>
          <h3>Подписки</h3>
          <div className={styles.followingGrid}>
            {followingUsers.map(u => (
              <div key={u.id} className={styles.followCard}>
                <img
                  src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}`}
                  alt={u.username}
                  className={styles.followAvatar}
                />
                <div>
                  <strong>{u.full_name || u.username}</strong>
                  <p className={styles.username}>@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
