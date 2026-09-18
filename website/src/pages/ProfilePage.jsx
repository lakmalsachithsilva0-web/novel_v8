import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMe, getUserProfile, resolveAssetUrl } from "../api";

export default function ProfilePage({ user }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (userId) {
          setProfile(await getUserProfile(userId));
        } else if (user) {
          setProfile(user);
        } else {
          try {
            setProfile(await getMe());
          } catch {
            setProfile(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container page-empty">
        <h3>Profile</h3>
        <p>Sign in to view your profile.</p>
      </div>
    );
  }

  const name = profile.display_name || profile.username || "Reader";
  const photo = resolveAssetUrl(profile.photo_url || "");

  return (
    <div className="container" style={{ paddingTop: 24, maxWidth: 640, paddingBottom: 40 }}>
      <div
        className="panel"
        style={{
          textAlign: "center",
          background: "linear-gradient(160deg, var(--purple-dim), var(--card))",
        }}
      >
        <div
          className="avatar-btn"
          style={{ width: 80, height: 80, margin: "0 auto 12px", fontSize: "1.75rem" }}
        >
          {photo ? <img src={photo} alt="" /> : name.charAt(0).toUpperCase()}
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "1.5rem" }}>{name}</h1>
        {profile.email && (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{profile.email}</p>
        )}
        {profile.bio && <p style={{ marginTop: 12, color: "var(--muted)" }}>{profile.bio}</p>}
      </div>
    </div>
  );
}
