import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Shell from "./components/Shell";
import AuthModal from "./components/AuthModal";
import DiscoverPage from "./pages/DiscoverPage";
import LibraryPage from "./pages/LibraryPage";
import WritePage from "./pages/WritePage";
import NotificationsPage from "./pages/NotificationsPage";
import MorePage from "./pages/MorePage";
import StoryPage from "./pages/StoryPage";
import ChapterPage from "./pages/ChapterPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import {
  clearToken,
  getBootstrap,
  getMe,
  getToken,
  guestLogin,
  setToken,
} from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [bootstrap, setBootstrap] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch {
      clearToken();
      setUser(null);
      return null;
    }
  }, []);

  const loadBootstrap = useCallback(async () => {
    try {
      const data = await getBootstrap();
      setBootstrap(data);
    } catch (e) {
      console.warn("bootstrap failed", e);
      setBootstrap(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!getToken()) {
          try {
            const g = await guestLogin();
            const token = g?.access_token || g?.token;
            if (token) setToken(token);
          } catch {
            /* optional */
          }
        }
        await Promise.all([refreshUser(), loadBootstrap()]);
      } finally {
        setBootLoading(false);
      }
    })();
  }, [refreshUser, loadBootstrap]);

  function openAuth(mode = "signin") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    navigate("/");
  }

  async function handleAuthSuccess(token) {
    if (token) setToken(token);
    await refreshUser();
    await loadBootstrap();
  }

  const isRealUser = user && !user.is_guest && user.provider !== "guest";

  return (
    <Shell
      user={user}
      isRealUser={!!isRealUser}
      onOpenAuth={openAuth}
      onLogout={handleLogout}
      bootLoading={bootLoading}
    >
      {bootLoading ? (
        <div className="page-loading">
          <div className="skeleton" style={{ height: 120, margin: "24px auto", maxWidth: 600 }} />
          <div className="skeleton" style={{ height: 200, margin: "16px auto", maxWidth: 900 }} />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<DiscoverPage bootstrap={bootstrap} />} />
          <Route
            path="/library"
            element={
              <LibraryPage
                user={user}
                isRealUser={!!isRealUser}
                onNeedAuth={() => openAuth("signin")}
              />
            }
          />
          <Route
            path="/write"
            element={
              <WritePage
                user={user}
                isRealUser={!!isRealUser}
                onNeedAuth={() => openAuth("signin")}
              />
            }
          />
          <Route
            path="/notifications"
            element={
              <NotificationsPage
                isRealUser={!!isRealUser}
                onNeedAuth={() => openAuth("signin")}
              />
            }
          />
          <Route
            path="/more"
            element={
              <MorePage
                user={user}
                isRealUser={!!isRealUser}
                onLogout={handleLogout}
                onOpenAuth={openAuth}
              />
            }
          />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/stories/:id" element={<StoryPage user={user} isRealUser={!!isRealUser} onNeedAuth={() => openAuth("signin")} />} />
          <Route
            path="/stories/:id/chapters/:chapterId"
            element={<ChapterPage user={user} />}
          />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route path="/profile/:userId" element={<ProfilePage user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </Shell>
  );
}
