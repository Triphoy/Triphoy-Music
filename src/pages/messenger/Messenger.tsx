import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import styles from './Messenger.module.css';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatUser {
  username: string;
  avatar_url?: string;
}

const Messenger: React.FC = () => {
  const { id: chatUserId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Загрузка данных пользователя чата
  useEffect(() => {
    if (!chatUserId) return;

    const fetchChatUser = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', chatUserId)
        .single();

      if (error) {
        console.error('Ошибка при загрузке данных пользователя для чата:', error);
        setChatUser(null);
      } else {
        setChatUser(data);
      }
    };

    fetchChatUser();
  }, [chatUserId]);

  // Загрузка сообщений
  useEffect(() => {
    if (!user || !chatUserId) return;

    setLoading(true);

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка при загрузке сообщений:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Подписка на новые сообщения в реальном времени
    const channel = supabase
      .channel(`messages:${user.id}:${chatUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id}))`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatUserId]);

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Автоматическое увеличение высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Отправка сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatUserId || isSending) return;

    const messageToSend = newMessage.trim();
    setIsSending(true);

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: chatUserId,
        content: messageToSend,
      },
    ]);

    if (error) {
      console.error('Ошибка при отправке сообщения:', error);
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  // Отправка по Enter (без Shift)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chatUser) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.emptyState}>Пользователь не найден</div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.topGradient}></div>
      
      <header className={styles.chatHeader}>
        <div className={styles.userInfo}>
          {chatUser.avatar_url && (
            <div className={styles.avatar} style={{ backgroundImage: `url(${chatUser.avatar_url})` }} />
          )}
          <div className={styles.chatTitle}>
            <span className={styles.username}>{chatUser.username}</span>
            <span className={styles.status}>online</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M15.25 8a.75.75 0 01-.75.75H8.75v5.75a.75.75 0 01-1.5 0V8.75H1.5a.75.75 0 010-1.5h5.75V1.5a.75.75 0 011.5 0v5.75h5.75a.75.75 0 01.75.75z" />
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.messagesList}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyIllustration} />
            <p className={styles.emptyState}>Начните диалог с {chatUser.username}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.sender_id === user?.id
                  ? styles.messageOutgoing
                  : styles.messageIncoming
              }
            >
              <div className={styles.messageContent}>{msg.content}</div>
              <div className={styles.messageMeta}>
                <span className={styles.messageTime}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender_id === user?.id && (
                  <span className={styles.messageStatus}>
                    <svg viewBox="0 0 16 16" width="12" height="12">
                      <path fill="currentColor" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.messageInputContainer}>
        <div className={styles.messageInput}>
          <button className={styles.attachmentButton}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path d="M20 13.5v-1a4.5 4.5 0 00-4.5-4.5H12v10h3.5a4.5 4.5 0 004.5-4.5zM12 8H7.5A4.5 4.5 0 003 12.5v1a4.5 4.5 0 004.5 4.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            className={styles.messageTextarea}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
          />
          <button
            className={styles.sendButton}
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <div className={styles.sendButtonSpinner} />
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M22 12l-20 10 5-10-5-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messenger;