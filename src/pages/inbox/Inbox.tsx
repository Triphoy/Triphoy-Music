import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:sender_id (
            username,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки сообщений:', error);
      } else {
        setMessages(data);
      }

      setLoading(false);
    };

    fetchMessages();
  }, [user]);

  if (loading) return <div>Загрузка сообщений...</div>;
  if (!messages.length) return <div>У вас нет входящих сообщений.</div>;

  return (
    <div>
      <h1>Входящие сообщения</h1>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
            <div style={{ fontWeight: 'bold' }}>{msg.sender?.username || 'Неизвестный'}</div>
            <div style={{ fontSize: '0.9em', color: '#777' }}>
              {new Date(msg.created_at).toLocaleString()}
            </div>
            <p>{msg.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Inbox;
