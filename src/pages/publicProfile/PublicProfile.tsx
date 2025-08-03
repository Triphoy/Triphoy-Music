import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import styles from './PublicProfile.module.css';

const PublicProfile: React.FC = () => {
  const { username } = useParams();
  const { user } = useAuth(); // Текущий пользователь
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [updatingFollow, setUpdatingFollow] = useState(false);

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Проверяем, подписан ли текущий пользователь на профиль
  const checkIfFollowing = async (targetId: string) => {
    if (!user?.id || !targetId) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId);

    if (error) {
      console.error('Ошибка checkIfFollowing:', error);
      setIsFollowing(false);
    } else {
      setIsFollowing(data.length > 0);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, location, website')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setProfile(null);
      } else {
        setProfile(data);
        if (user && data.id !== user.id) {
          await checkIfFollowing(data.id);
        } else {
          setIsFollowing(false);
        }
      }

      setLoading(false);
    };

    fetchProfile();
  }, [username, user]);

  const handleFollowToggle = async () => {
    if (!user || !profile) return;
    setUpdatingFollow(true);

    if (isFollowing) {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);

      if (error) {
        console.error('Ошибка отписки:', error);
      } else {
        setIsFollowing(false);
      }
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert([{ follower_id: user.id, following_id: profile.id }]);

      if (error) {
        console.error('Ошибка подписки:', error);
      } else {
        setIsFollowing(true);
      }
    }

    setUpdatingFollow(false);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user || !profile) return;

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: profile.id,
        content: messageText.trim(),
      },
    ]);

    if (error) {
      console.error('Ошибка при отправке сообщения:', error);
    } else {
      setMessageText('');
      setShowMessageForm(false);
      alert('Сообщение отправлено!');
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка профиля...</div>;
  if (!profile) return <div className={styles.notFound}>Профиль не найден</div>;

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className={styles.profilePage}>
      <h1>Профиль: {profile.username}</h1>
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <img
            src={
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${profile.username}`
            }
            alt="Avatar"
            className={styles.avatar}
          />
        </div>
        <div className={styles.infoSection}>
          <h2>{profile.full_name || profile.username}</h2>
          <p className={styles.role}>beatmaker</p>
          <p>{profile.bio}</p>

          <div className={styles.socialLinks}>
            {profile.website && (
              <a
                href={
                  profile.website.startsWith('http')
                    ? profile.website
                    : `https://${profile.website}`
                }
                className={styles.socialLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.socialIcon}>🌐</span>
                {profile.website.replace(/(^\w+:|^)\/\//, '')}
              </a>
            )}
            {profile.location && (
              <span className={styles.socialLink}>
                <span className={styles.socialIcon}>📍</span>
                {profile.location}
              </span>
            )}
          </div>

          {!isOwnProfile && user && (
            <>
              <button
                className={styles.followButton}
                onClick={handleFollowToggle}
                disabled={updatingFollow}
              >
                {isFollowing ? 'Отписаться' : 'Подписаться'}
              </button>

              <button
                className={styles.messageButton}
                onClick={() => navigate(`/messenger/${profile.id}`)}
              >
                Написать сообщение
              </button>

              {showMessageForm && (
                <div className={styles.messageForm}>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Введите сообщение..."
                  />
                  <button onClick={sendMessage}>Отправить</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
