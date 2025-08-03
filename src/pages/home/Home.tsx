import React, { useEffect, useState } from "react";
import { FaSpotify, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { SiYoutubemusic } from "react-icons/si";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useSession } from "@supabase/auth-helpers-react";
import { usePlayer } from "../../context/PlayerContext";

import cover1 from "./img/cover1.jpg";
import cover2 from "./img/cover2.jpg";
import subscribe from "./img/subscribe.png";
import artistCover from "./img/OsamaSon.svg"; 
import artistCover2 from "./img/Ken Carson.svg";
import artistCover3 from "./img/Che.svg"; 

import "./Home.css";

interface Track {
  id: number;
  title: string;
  artist: string;
  genre: string;
  mood?: string;
  explicit: boolean;
  url: string;
  cover_url?: string;
}

interface Artist {
  name: string;
  track_count: number;
  cover_url?: string;
}

const Home: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [todayTracks, setTodayTracks] = useState<Track[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  
  const session = useSession();
  const { setCurrentTrack, setPlaylist, togglePlay, isShuffleOn, toggleShuffle } = usePlayer();

  const events = [
    {
      id: 1,
      artist: "OsamaSon",
      date: "Flex арена, 25 сентября, 19:00",
      price: "от 1 800 ₽",
      imageUrl: artistCover
    },
    {
      id: 2,
      artist: "Ken Carson",
      date: "ГлавClub, 30 сентября, 20:00",
      price: "от 2 000 ₽",
      imageUrl: artistCover2
    },
    {
      id: 3,
      artist: "Che",
      date: "Adrenaline Stadium, 5 октября, 21:00",
      price: "от 1 500 ₽",
      imageUrl: artistCover3
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEventIndex((prevIndex) => 
        prevIndex === events.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [events.length]);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка загрузки треков:", error.message);
        return;
      }

      const publicTracks = data.map(t => ({
        ...t,
        url: `https://pkjhtwnpgllkzcqalikd.supabase.co/storage/v1/object/public/music/${t.url}`,
        cover_url: t.cover_url || ""
      }));

      setTracks(publicTracks);

      const lastUpdate = localStorage.getItem("todayTracksTimestamp");
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastUpdate || now - parseInt(lastUpdate) > oneDay) {
        const shuffled = [...publicTracks].sort(() => 0.5 - Math.random());
        const sample = shuffled.slice(0, 3);
        setTodayTracks(sample);
        localStorage.setItem("todayTracks", JSON.stringify(sample));
        localStorage.setItem("todayTracksTimestamp", now.toString());
      } else {
        const cached = localStorage.getItem("todayTracks");
        if (cached) setTodayTracks(JSON.parse(cached));
      }
    };

    fetchTracks();
  }, []);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('artist, cover_url')
        .order('artist', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки артистов:', error.message);
        return;
      }

      const artistMap = new Map<string, Artist>();
      
      data.forEach(track => {
        if (!track.artist) return;
        
        if (artistMap.has(track.artist)) {
          const artist = artistMap.get(track.artist)!;
          artistMap.set(track.artist, {
            ...artist,
            track_count: artist.track_count + 1,
            cover_url: artist.cover_url || track.cover_url || ''
          });
        } else {
          artistMap.set(track.artist, {
            name: track.artist,
            track_count: 1,
            cover_url: track.cover_url || ''
          });
        }
      });

      setArtists(Array.from(artistMap.values()));
    };

    fetchArtists();
  }, []);

  useEffect(() => {
    if (tracks.length > 0 && todayTracks.length > 0) {
      setPlaylist([...todayTracks, ...tracks]);
    }
  }, [tracks, todayTracks, setPlaylist]);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("likes")
        .select("track_id")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Ошибка загрузки лайков:", error.message);
      } else {
        setFavoriteIds(data.map(like => like.track_id));
      }
    };

    fetchLikes();
  }, [session]);

  const toggleFavorite = async (trackId: number) => {
    if (!session?.user) {
      alert("Войдите, чтобы сохранять избранное");
      return;
    }

    const isLiked = favoriteIds.includes(trackId);

    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .match({ user_id: session.user.id, track_id: trackId });

      if (!error) {
        setFavoriteIds(prev => prev.filter(id => id !== trackId));
      }
    } else {
      const { error } = await supabase.from("likes").insert([
        {
          user_id: session.user.id,
          track_id: trackId,
        },
      ]);

      if (!error) {
        setFavoriteIds(prev => [...prev, trackId]);
      }
    }
  };

  const handleSubscribeClick = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleEventClick = () => {
    setEventModalVisible(true);
  };

  const closeEventModal = () => {
    setEventModalVisible(false);
  };
  
  const playRandomTracks = () => {
    if (tracks.length === 0) return;

    const shuffled = [...tracks].sort(() => 0.5 - Math.random());
    setPlaylist(shuffled);
    setCurrentTrack(shuffled[0]);

    if (!isShuffleOn) toggleShuffle();
    togglePlay();
  };

  return (
    <Layout>
      <div className="home-page">
        <h1>Главная</h1>

        <div className="wave-container">
          <div className="wave-background"></div>
          <div className="wave-content">
            <div className="wave-text">
              <h2 className="wave-title">Рандом музик</h2>
              <p className="wave-subtitle">Персональная подборка на основе ваших вкусов</p>
            </div>
            <button className="wave-button" onClick={playRandomTracks}>
              <div className="wave-button-content">
                <span>Слушать</span>
                <div className="wave-button-icon">
                  <FaSpotify />
                </div>
              </div>
              <div className="wave-button-background"></div>
              <div className="wave-button-pulse"></div>
            </button>
          </div>
          <div className="wave-visual">
            <div className="wave-circle"></div>
            <div className="wave-circle"></div>
            <div className="wave-circle"></div>
            <div className="wave-disc"></div>
          </div>
          <div className="wave-particles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="wave-particle"></div>
            ))}
          </div>
        </div>

        <h1 style={{ fontSize: "28px" }}>Новинки</h1>

        {/* Секция треков */}
        <div style={{ position: 'relative' }}>
          <div className="cards-container">
            {tracks.map(track => (
              <div
                className="music-card"
                key={track.id}
                onClick={() => {
                  setCurrentTrack(track);
                  setTimeout(() => togglePlay(), 100);
                }}
              >
                <div className="cover-wrapper">
                  <img
                    src={track.cover_url || cover1}
                    alt="Обложка трека"
                    className="cover"
                  />
                  <button
                    className="like-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                  >
                    {favoriteIds.includes(track.id) ? (
                      <FaHeart color="#f81111" />
                    ) : (
                      <FaRegHeart />
                    )}
                  </button>
                </div>
                <div className="info">
                  <h3 className="title">{track.title}</h3>
                  <p className="artist">{track.artist}</p>
                  <p className="duration">{track.genre}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="cards-navigation">
            <button 
              className="scroll-button"
              onClick={() => {
                const container = document.querySelector('.cards-container');
                container?.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              aria-label="Прокрутить влево"
            >
              <FaChevronLeft />
            </button>
            <button 
              className="scroll-button"
              onClick={() => {
                const container = document.querySelector('.cards-container');
                container?.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              aria-label="Прокрутить вправо"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Секция плейлистов */}
        <div className="playlists-section">
          <h2>Плейлисты (скоро)</h2>
          <div style={{ position: 'relative' }}>
            <div className="playlists-container cards-container">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <div className="playlist-card" key={i}>
                  <div className="playlist-cover-wrapper">
                    <img src={cover2} alt="Обложка" className="playlist-cover" />
                    <div className="playlist-badge">
                      {["MOST PLAYED", "NEW", "TRENDING", "HOT", "CHILL", "WORKOUT"][i]}
                    </div>
                  </div>
                  <div className="playlist-info">
                    <h4 className="playlist-title">
                      {["Summer Vibes", "Workout Mix", "Chill Evening", "Late Night", "Focus Mode", "Party Time"][i]}
                    </h4>
                    <p className="playlist-creator">
                      By {["User123", "FitnessGuru", "MusicLover", "DJPro", "Concentrate", "PartyAnimal"][i]}
                    </p>
                    <div className="playlist-stats">
                      <div className="playlist-left-stats">
                        <div className="playlist-tracks">
                          {[12, 15, 10, 18, 8, 20][i]} SONGS
                        </div>
                        <div className="playlist-likes">
                          ♥ {[1200, 856, 2400, 3200, 1500, 4500][i]}
                        </div>
                      </div>
                      <div className="playlist-plays">
                        ▶ {[45600, 12300, 78900, 102400, 45600, 156000][i]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cards-navigation">
              <button 
                className="scroll-button"
                onClick={() => {
                  const container = document.querySelector('.playlists-container');
                  container?.scrollBy({ left: -300, behavior: 'smooth' });
                }}
              >
                <FaChevronLeft />
              </button>
              <button 
                className="scroll-button"
                onClick={() => {
                  const container = document.querySelector('.playlists-container');
                  container?.scrollBy({ left: 300, behavior: 'smooth' });
                }}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Секция мероприятий */}
        {/* Секция мероприятий */}
<div className="events-section">
  <h2>Ближайшие концерты</h2>
  
  {/* Мобильная версия (карусель) */}
  <div className="mobile-events-container">
    {events.map((event) => (
      <div className="mobile-event-card" key={event.id} onClick={handleEventClick}>
        <div className="mobile-event-image-container">
          <img src={event.imageUrl} alt={event.artist} className="mobile-event-image" />
          <div className="mobile-event-overlay">
            <span className="mobile-event-price">{event.price}</span>
            <span className="mobile-event-badge">18+</span>
          </div>
        </div>
        <div className="mobile-event-info">
          <h3 className="mobile-event-artist">{event.artist}</h3>
          <p className="mobile-event-date">{event.date}</p>
          <button className="mobile-event-button">
            Купить билет
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    ))}
  </div>

  {/* Десктопная версия (анимированные карточки) */}
  <div className="desktop-events-container">
    {events.map((event, index) => (
      <div 
        className={`desktop-event-card ${index === currentEventIndex ? 'active' : ''}`} 
        key={event.id}
        onClick={handleEventClick}
      >
        <div className="desktop-event-content">
          <div className="desktop-event-header">
            <span className="desktop-event-price">{event.price}</span>
            <span className="desktop-event-badge">18+</span>
          </div>
          <div className="desktop-event-info">
            <h3 className="desktop-event-artist">{event.artist}</h3>
            <p className="desktop-event-date">{event.date}</p>
          </div>
        </div>
        <div className="desktop-event-image-wrapper">
          <img 
            src={event.imageUrl} 
            alt={event.artist} 
            className="desktop-event-image" 
          />
        </div>
      </div>
    ))}
  </div>
</div>

        {/* Секция артистов */}
        <div className="artist-section">
          <h2>Артисты</h2>
          <div style={{ position: 'relative' }}>
            <div className="artist-grid cards-container">
              {artists.map((artist, index) => (
                <div className="artist-card" key={index}>
                  <div className="artist-cover-wrapper">
                    <img
                      src={artist.cover_url || cover1}
                      alt={artist.name}
                      className="artist-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = cover1;
                      }}
                    />
                  </div>
                  <div className="artist-info">
                    <div className="artist-name">{artist.name}</div>
                    <div className="artist-songs">
                      {artist.track_count} {artist.track_count === 1 ? 'трек' : artist.track_count < 5 ? 'трека' : 'треков'}
                    </div>
                    <div className="artist-links">
                      <a href="#" target="_blank" rel="noreferrer">
                        <FaSpotify className="icon-spotify" />
                      </a>
                      <a href="#" target="_blank" rel="noreferrer">
                        <SiYoutubemusic className="icon-yandex" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cards-navigation">
              <button 
                className="scroll-button"
                onClick={() => {
                  const container = document.querySelector('.artist-grid');
                  container?.scrollBy({ left: -300, behavior: 'smooth' });
                }}
              >
                <FaChevronLeft />
              </button>
              <button 
                className="scroll-button"
                onClick={() => {
                  const container = document.querySelector('.artist-grid');
                  container?.scrollBy({ left: 300, behavior: 'smooth' });
                }}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Секция "На сегодня" */}
        <div className="today-section">
          <h2>На сегодня</h2>
          <div style={{ position: 'relative' }}>
            <div className="today-cards cards-container">
              {todayTracks.map((track, index) => (
                <div
                  className="today-card"
                  key={track.id}
                  onClick={() => {
                    setCurrentTrack(track);
                    setTimeout(() => togglePlay(), 100);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="today-badge">
                    {["Хит", "Новинка", "Тренд", "Выбор редакции", "Классика", "Эксклюзив"][index % 6]}
                  </div>
                  <div className="today-cover-wrapper">
                    <img
                      src={track.cover_url || cover1}
                      alt={track.title}
                      className="today-cover"
                    />
                    <button
                      className="like-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track.id);
                      }}
                    >
                      {favoriteIds.includes(track.id) ? (
                        <FaHeart color="#fff" />
                      ) : (
                        <FaRegHeart />
                      )}
                    </button>
                  </div>

                  <div className="today-info">
                    <h3 className="today-title">{track.title}</h3>
                    <p className="today-artist">{track.artist}</p>
                    <div className="today-stats">
                      <span className="today-duration">{track.genre}</span>
                      <div className="today-likes">
                        <FaHeart color="#1DB954" />
                        <span>
                          {favoriteIds.includes(track.id)
                            ? `${(Math.floor(Math.random() * 10) + 1)}K`
                            : `${(Math.floor(Math.random() * 5) + 1)}K`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cards-navigation">
              <button 
                className="scroll-button"
                onClick={() => {
                  const container = document.querySelector('.today-cards');
                  container?.scrollBy({ left: -300, behavior: 'smooth' });
                }}
              >
                <FaChevronLeft />
              </button>
              <button 
                className="scroll-button"
                onClick={() => {
                  const container = document.querySelector('.today-cards');
                  container?.scrollBy({ left: 300, behavior: 'smooth' });
                }}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Рекламный баннер */}
        <div className="ad-section">
          <div className="ad-container">
            <div className="ad-content">
              <h3 className="ad-title">Премиум подписка</h3>
              <p className="ad-text">
                Получите неограниченный доступ ко всей музыке без рекламы и с
                высочайшим качеством звучания.
              </p>
              <button className="ad-button" onClick={handleSubscribeClick}>
                Попробовать 3 месяца бесплатно
              </button>
            </div>
            <img src={subscribe} alt="Премиум подписка" className="ad-image" />
          </div>
        </div>

        {/* Модальное окно подписки */}
        {modalVisible && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Скоро будет реализована система подписки на сервис</h2>
              <p>
                Сейчас функционал находится в разработке. Если вы бизнесмен и готовы вложиться в проект, пишите в Telegram:{" "}
                <a href="https://t.me/nupotomy" target="_blank" rel="noopener noreferrer">@nupotomy</a>
              </p>
              <button className="modal-close-button" onClick={closeModal}>Закрыть</button>
            </div>
          </div>
        )}

        {/* Модальное окно для концертов */}
        {eventModalVisible && (
          <div className="modal-overlay" onClick={closeEventModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Реклама концертов</h2>
              <p>
                Если вы артист или компания, вы можете купить рекламу у нас. 
                Ваше мероприятие появится здесь после покупки.
              </p>
              <p>
                Для размещения рекламы свяжитесь с нами в Telegram:{" "}
                <a href="https://t.me/nupotomy" target="_blank" rel="noopener noreferrer">@nupotomy</a>
              </p>
              <button className="modal-close-button" onClick={closeEventModal}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;