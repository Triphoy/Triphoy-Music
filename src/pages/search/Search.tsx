// Search.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { debounce } from "lodash";
import { Link } from "react-router-dom";
import styles from "./Search.module.css";
import { FaSearch, FaSpinner } from "react-icons/fa";

export const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async (username: string) => {
    if (!username) {
      setResults([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("id, username, avatar_url, full_name")
      .ilike("username", `${username}%`);

    if (error) {
      console.error("Ошибка поиска:", error.message);
      setResults([]);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  const debouncedFetch = useCallback(
    debounce((text: string) => {
      fetchResults(text);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  return (
    <div className={styles.searchPage}>
      <h2 className={styles.title}><FaSearch /> Поиск пользователей</h2>
      
      <div className={styles.searchInputContainer}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Введите username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading && (
        <div className={styles.loadingIndicator}>
          <FaSpinner className={styles.spinner} />
          <span>Загрузка...</span>
        </div>
      )}

      <div className={styles.searchResults}>
        {results.length > 0 ? (
          results.map((user) => (
            <Link
              to={`/profile/${user.username}`}
              key={user.id}
              className={styles.searchResult}
            >
              <img
                src={user.avatar_url || "/default-avatar.png"}
                alt={user.username}
                className={styles.avatar}
              />
              <div className={styles.userInfo}>
                <strong className={styles.username}>{user.username}</strong>
                <p className={styles.fullName}>{user.full_name}</p>
              </div>
            </Link>
          ))
        ) : (
          query.length > 0 &&
          !loading && <p className={styles.noResults}>Ничего не найдено по запросу "{query}"</p>
        )}
      </div>
    </div>
  );
};