import { useEffect, useState } from "react";
import { getMyActivity, getNotifications } from "../api";

export default function NotificationsPage({ isRealUser, onNeedAuth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRealUser) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [n, a] = await Promise.all([getNotifications(), getMyActivity()]);
        const notifs = n?.items || (Array.isArray(n) ? n : []);
        const acts = a?.items || (Array.isArray(a) ? a : []);
        const merged = [
          ...notifs.map((x) => ({
            title: x.title || "Notification",
            message: x.message || x.body || "",
            time: x.created_at || x.created_at_text || "",
          })),
          ...acts.map((x) => ({
            title: x.title || x.type || "Activity",
            message: x.message || x.body || "",
            time: x.created_at || "",
          })),
        ];
        setItems(merged);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isRealUser]);

  if (!isRealUser) {
    return (
      <div className="container page-empty">
        <h3>Notifications</h3>
        <p>Sign in to see alerts and activity.</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNeedAuth}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 20, maxWidth: 720 }}>
      <h1 className="section-title" style={{ marginBottom: 16 }}>
        Notifications
      </h1>
      {loading ? (
        <div className="skeleton" style={{ height: 80 }} />
      ) : items.length === 0 ? (
        <div className="page-empty">
          <p>You&apos;re all caught up.</p>
        </div>
      ) : (
        items.map((n, i) => (
          <div key={i} className="notif-item" style={{ animationDelay: `${i * 0.04}s` }}>
            <h4>{n.title}</h4>
            {n.message && <p>{n.message}</p>}
            {n.time && (
              <p style={{ fontSize: "0.75rem", marginTop: 6, opacity: 0.7 }}>{String(n.time)}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
