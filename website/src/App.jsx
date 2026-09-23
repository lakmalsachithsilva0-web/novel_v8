import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import StoryPage from "./pages/StoryPage";
import ChapterPage from "./pages/ChapterPage";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import WritePage from "./pages/WritePage";
import StoryEditorPage from "./pages/StoryEditorPage";
import ManageStoriesPage from "./pages/ManageStoriesPage";
import GenrePage from "./pages/GenrePage";
import AuthorPage from "./pages/AuthorPage";
import ReviewPage from "./pages/ReviewPage";
import ProfilePage from "./pages/ProfilePage";
import AccountPage, {
  AccountHelp,
  AccountContact,
  AccountStats,
  AccountNotifications,
  AccountGenres,
  AccountWarnings,
  AccountLegal,
  AccountLanguage,
} from "./pages/AccountPage";
import { getMe, guestLogin, setToken, getToken, clearToken } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch (e) {
      // 401/403 = bad or revoked token — clear and allow guest re-login
      const status = e?.status;
      if (status === 401 || status === 403 || !status) {
        clearToken();
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let token = getToken();
        if (token) {
          const me = await refreshUser();
          if (me) {
            setBootLoading(false);
            return;
          }
        }
        try {
          const g = await guestLogin();
          const t = g?.access_token || g?.token;
          if (t) {
            setToken(t);
            await refreshUser();
          }
        } catch {
          /* guest optional if backend down */
        }
      } finally {
        setBootLoading(false);
      }
    })();
  }, [refreshUser]);

  function handleLogout() {
    clearToken();
    setUser(null);
  }

  async function handleLoginSuccess(token) {
    if (token) setToken(token);
    await refreshUser();
  }

  return (
    <div className="app-shell">
      <Header user={user} onLogout={handleLogout} onAuthSuccess={handleLoginSuccess} />
      <main className="main">
        {bootLoading ? (
          <div className="page-loading">Loading…</div>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Discover removed — same content as Home */}
            <Route path="/discover" element={<Navigate to="/" replace />} />
            <Route path="/genres/:genre" element={<GenrePage />} />
            <Route path="/stories/:id" element={<StoryPage user={user} />} />
            <Route path="/stories/:id/review" element={<ReviewPage user={user} />} />
            <Route path="/stories/:id/chapters/:chapterId" element={<ChapterPage user={user} />} />
            <Route path="/authors/:authorId" element={<AuthorPage />} />
            <Route path="/library" element={<LibraryPage user={user} />} />
            <Route path="/write" element={<WritePage user={user} />} />
            <Route path="/write/:storyId" element={<StoryEditorPage user={user} />} />
            <Route path="/edit/:storyId" element={<StoryEditorPage user={user} />} />
            <Route path="/write/new" element={<StoryEditorPage user={user} />} />
            <Route path="/write/stories/:storyId" element={<StoryEditorPage user={user} />} />
            <Route path="/manage-stories" element={<ManageStoriesPage user={user} />} />
            <Route path="/login" element={<LoginPage onSuccess={handleLoginSuccess} />} />
            <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
            <Route path="/account" element={<AccountPage user={user} onLogout={handleLogout} />} />
            <Route path="/account/help" element={<AccountHelp />} />
            <Route path="/account/contact" element={<AccountContact />} />
            <Route path="/account/stats" element={<AccountStats user={user} />} />
            <Route path="/account/notifications" element={<AccountNotifications />} />
            <Route path="/account/language" element={<AccountLanguage />} />
            <Route path="/account/genres" element={<AccountGenres />} />
            <Route path="/account/warnings" element={<AccountWarnings />} />
            <Route path="/account/terms" element={<AccountLegal kind="terms" />} />
            <Route path="/account/privacy" element={<AccountLegal kind="privacy" />} />
            <Route path="/account/cookies" element={<AccountLegal kind="cookies" />} />

            <Route path="/audiobooks" element={<Navigate to="/" replace />} />
            <Route path="/galatea" element={<Navigate to="/" replace />} />
            <Route path="/contests" element={<Navigate to="/" replace />} />
            <Route path="/subscription" element={<Navigate to="/manage-stories" replace />} />
            <Route path="/community" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <Footer />
    </div>
  );
}
