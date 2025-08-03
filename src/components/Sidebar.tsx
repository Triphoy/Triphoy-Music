// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { Sun, LogOut, Menu, X, MessageCircle } from "lucide-react"; // импортируем иконку MessageCircle
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import "./Slidebar.css";

export const Sidebar = () => {
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <>
        <header className="mobile-header">
          <div className="mobile-header-content">
            <button 
              className="burger-menu" 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="mobile-logo">Triphoy Music</h1>
            <button className="mobile-theme-toggle">
              <Sun size={20} />
            </button>
          </div>

          {isOpen && (
            <div className="mobile-menu">
              <NavLink 
                to="/" 
                end 
                className="mobile-menu-item"
                onClick={() => setIsOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                <span>Главная</span>
              </NavLink>

              <NavLink 
                to="/profile" 
                className="mobile-menu-item"
                onClick={() => setIsOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Профиль</span>
              </NavLink>

              <NavLink 
  to="/favorites" 
  className="mobile-menu-item" // или mobile-menu-item
  onClick={() => setIsOpen?.(false)} // для mobile, игнорируй в desktop
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
  <span>Избранное</span>
</NavLink>

 <NavLink 
  to="/search" 
  className="mobile-menu-item"
  onClick={() => setIsOpen(false)}
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <span>Поиск</span>
</NavLink>





              <NavLink 
                to="/upload" 
                className="mobile-menu-item"
                onClick={() => setIsOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Загрузить</span>
              </NavLink>

              <NavLink 
  to="/favorites" 
  className="menu-item" // или mobile-menu-item
  onClick={() => setIsOpen?.(false)} // для mobile, игнорируй в desktop
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
  <span>Избранное</span>
</NavLink>


              <NavLink 
                to="/admin" 
                className="mobile-menu-item"
                onClick={() => setIsOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="..." />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Админ</span>
              </NavLink>

              <NavLink
                to="/messenger"
                className="mobile-menu-item"
                onClick={() => setIsOpen(false)}
              >
                <MessageCircle size={20} />
                <span>Мессенджер</span>
              </NavLink>

              <button 
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }} 
                className="mobile-logout-button"
              >
                <LogOut size={20} />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </header>
      </>
    );
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">Triphoy Music</h1>
        <button className="theme-toggle" id="themeToggle">
          <Sun size={20} />
        </button>
      </div>

      <div className="sidebar-menu">
        <NavLink to="/" end className="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          <span>Главная</span>
        </NavLink>

        <NavLink to="/profile" className="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Профиль</span>
        </NavLink>

        <NavLink to="/upload" className="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Загрузить</span>
        </NavLink>

        <NavLink to="/favorites" className="menu-item">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
  <span>Избранное</span>
</NavLink>


<NavLink to="/search" className="menu-item">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <span>Поиск</span>
</NavLink>

<NavLink to="/messenger" className="menu-item">
          <MessageCircle size={20} />
          <span>Мессенджер</span>
        </NavLink>


        <NavLink to="/admin" className="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="..." />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Админ</span>
        </NavLink>
      </div>

      <button onClick={logout} className="logout-button">
        <LogOut size={20} />
        <span>Выйти</span>
      </button>
    </nav>
  );
};