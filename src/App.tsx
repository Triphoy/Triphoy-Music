// src/App.tsx
import { useState, useEffect, ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { Sidebar } from "./components/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "./lib/supabase";

import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profil";
import Upload from "./pages/upload/Upload";
import Admin from "./pages/admin/Admin";
import Favorites from "./pages/favorite/Favorite";
import { Search } from "./pages/search/Search";
import PublicProfile from "./pages/publicProfile/PublicProfile";
import Inbox from "./pages/inbox/Inbox";
import MessengerPage from "./pages/MessengerPage/MessengerPage";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import { PlayerProvider } from "./context/PlayerContext";
import Player from "./components/Player";



const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const hideSidebar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideSidebar && isAuthenticated && <Sidebar />}
      <div
        style={{
  marginLeft: !hideSidebar && isAuthenticated && !isMobile ? "280px" : 0,
  padding: "24px",
  transition: "margin-left 0.3s ease",
  minHeight: "100vh",
  overflow: "auto",
}}

      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* MessengerPage рендерит и список, и чат */}
          <Route
            path="/messenger"
            element={
              <ProtectedRoute>
                <MessengerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messenger/:id"
            element={
              <ProtectedRoute>
                <MessengerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <SessionContextProvider supabaseClient={supabase}>
        <AuthProvider>
          <PlayerProvider>
            <AppLayout />
            <Player />
          </PlayerProvider>
        </AuthProvider>
      </SessionContextProvider>
    </Router>
  );
}
