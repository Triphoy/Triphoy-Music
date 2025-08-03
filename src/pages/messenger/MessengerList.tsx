import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import styles from "./Messenger.module.css";

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
}

const MessengerList: React.FC = () => {
  const { user } = useAuth();
  const { id: openChatId } = useParams<{ id: string }>();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessages, setNewMessages] = useState<Record<string, boolean>>({});
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!user) return;

    const fetchChatUsers = async () => {
      setLoading(true);
      
      // Получаем последние сообщения для каждого чата
      const { data: lastMessages, error: messagesError } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Ошибка при загрузке сообщений:", messagesError);
        setLoading(false);
        return;
      }

      const userIds = new Set<string>();
      const lastMessagesMap = new Map<string, {content: string, time: string}>();

      lastMessages?.forEach((msg) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        userIds.add(otherUserId);
        
        if (!lastMessagesMap.has(otherUserId)) {
          lastMessagesMap.set(otherUserId, {
            content: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      });

      if (userIds.size === 0) {
        setChatUsers([]);
        setLoading(false);
        return;
      }

      // Получаем данные пользователей
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.error("Ошибка при загрузке профилей:", profilesError);
      } else {
        const enrichedProfiles = profiles?.map(profile => ({
          ...profile,
          last_message: lastMessagesMap.get(profile.id)?.content,
          last_message_time: lastMessagesMap.get(profile.id)?.time
        })) || [];
        
        setChatUsers(enrichedProfiles);
      }

      setLoading(false);
    };

    fetchChatUsers();
  }, [user]);

  // Подписка на новые сообщения (ваш существующий код)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as {
            sender_id: string;
            receiver_id: string;
            content: string;
          };

          if (newMsg.receiver_id === user.id) {
            if (newMsg.sender_id !== openChatId) {
              setNewMessages((prev) => ({
                ...prev,
                [newMsg.sender_id]: true,
              }));
            }
            
            // Обновляем последнее сообщение в списке
            setChatUsers(prev => prev.map(user => 
              user.id === newMsg.sender_id 
                ? { 
                    ...user, 
                    last_message: newMsg.content,
                    last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  } 
                : user
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, openChatId]);

  // Сброс уведомлений (ваш существующий код)
  useEffect(() => {
    if (!openChatId) return;

    setNewMessages((prev) => {
      if (prev[openChatId]) {
        const copy = { ...prev };
        delete copy[openChatId];
        return copy;
      }
      return prev;
    });
  }, [openChatId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка чатов...</p>
      </div>
    );
  }

  if (chatUsers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIllustration}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="var(--primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3>Нет чатов</h3>
        <p>Начните новую беседу</p>
      </div>
    );
  }

  return (
    <div className={styles.messengerList}>
      <div className={styles.listHeader}>
        <h2>Чаты</h2>
        <button 
          className={styles.newChatButton}
          onClick={() => navigate('/search')} // Добавлен обработчик навигации
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      <ul className={styles.chatList}>
        {chatUsers.map((chatUser) => (
          <li 
            key={chatUser.id} 
            className={`${styles.chatItem} ${openChatId === chatUser.id ? styles.activeChat : ''}`}
          >
            <Link to={`/messenger/${chatUser.id}`} className={styles.chatLink}>
              <div className={styles.avatarContainer}>
                {chatUser.avatar_url ? (
                  <img 
                    src={chatUser.avatar_url} 
                    alt={chatUser.username} 
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {chatUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {newMessages[chatUser.id] && (
                  <span className={styles.notificationBadge}></span>
                )}
              </div>
              
              <div className={styles.chatInfo}>
                <div className={styles.chatHeader}>
                  <h3 className={styles.username}>{chatUser.username}</h3>
                  <span className={styles.time}>{chatUser.last_message_time}</span>
                </div>
                <p className={styles.lastMessage}>
                  {chatUser.last_message?.substring(0, 50)}
                  {chatUser.last_message && chatUser.last_message.length > 50 ? '...' : ''}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MessengerList;