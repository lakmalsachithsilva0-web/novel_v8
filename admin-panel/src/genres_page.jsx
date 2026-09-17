import { useEffect, useState } from "react";
import {
  listAdminGenres,
  createAdminGenre,
  updateAdminGenre,
  deleteAdminGenre,
  uploadImage,
  listAdminUserReports,
  resolveAdminUserReport,
} from "./api";

/** Cover field: path paste + file upload (uses /api/upload-image). */
function CoverField({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const res = await uploadImage(file);
      const path = res?.path || res?.cover_path || res?.url || "";
      if (!path) throw new Error("Upload returned no path");
      onChange(path);
    } catch (ex) {
      setErr(ex.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200, flex: 1 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cover path / URL or upload →"
          style={{ flex: 1, minWidth: 140 }}
          disabled={disabled || uploading}
        />
        <label className="btn-ghost" style={{ cursor: "pointer", margin: 0 }}>
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={disabled || uploading}
            onChange={onFile}
          />
        </label>
      </div>
      {value ? (
        <img
          src={value.startsWith("http") || value.startsWith("/") ? value : value}
          alt=""
          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
          onError={(e) => {
            e.currentTarget.style.opacity = "0.3";
          }}
        />
      ) : null}
      {err ? <span style={{ color: "#f87171", fontSize: 12 }}>{err}</span> : null}
    </div>
  );
}

export function GenresPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [coverPath, setCoverPath] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminGenres();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "Failed to load genres");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    setError("");
    try {
      await createAdminGenre({
        name: n,
        cover_path: coverPath.trim(),
        description: description.trim(),
      });
      setName("");
      setCoverPath("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function onEdit(g) {
    const nextName = window.prompt("Genre name", g.name);
    if (nextName === null) return;
    const nextCover = window.prompt(
      "Cover path (or cancel and use Upload on create row). Leave as-is to keep.",
      g.cover_path || ""
    );
    if (nextCover === null) return;
    const nextDesc = window.prompt("Description", g.description || "");
    if (nextDesc === null) return;
    setBusy(true);
    try {
      await updateAdminGenre(g.id, {
        name: nextName.trim(),
        cover_path: nextCover.trim(),
        description: nextDesc.trim(),
      });
      await load();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUploadCover(g, file) {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadImage(file);
      const path = res?.path || res?.cover_path || res?.url || "";
      if (!path) throw new Error("No path");
      await updateAdminGenre(g.id, { cover_path: path });
      await load();
    } catch (err) {
      setError(err.message || "Cover upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(g) {
    if (!window.confirm(`Delete genre "${g.name}"?`)) return;
    setBusy(true);
    try {
      await deleteAdminGenre(g.id);
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h3>Genre management</h3>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          Genre hubs on Flutter / website use these names and cover images. Upload an image or paste
          a <code>/api/media/…</code> path.
        </p>
        <form
          onSubmit={onCreate}
          style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-start" }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Genre name (e.g. Romance)"
            style={{ flex: 1, minWidth: 140 }}
          />
          <CoverField value={coverPath} onChange={setCoverPath} disabled={busy} />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            style={{ flex: 1, minWidth: 140 }}
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            Add genre
          </button>
          <button type="button" className="btn-ghost" onClick={load} disabled={busy}>
            Refresh
          </button>
        </form>
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id}>
                  <td>
                    {g.cover_path ? (
                      <img
                        src={g.cover_path}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>{g.name}</td>
                  <td>{g.slug}</td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {g.description || "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <label className="btn-ghost" style={{ cursor: "pointer", marginRight: 4 }}>
                      Cover
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={busy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) onUploadCover(g, f);
                        }}
                      />
                    </label>
                    <button className="btn-ghost" type="button" onClick={() => onEdit(g)} disabled={busy}>
                      Edit
                    </button>
                    <button className="btn-ghost" type="button" onClick={() => onDelete(g)} disabled={busy}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                    No genres yet. Create Romance, Fantasy, etc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function UserReportsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const data = await listAdminUserReports();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "Failed to load user reports");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id) {
    setBusy(true);
    try {
      await resolveAdminUserReport(id);
      await load();
    } catch (e) {
      setError(e.message || "Resolve failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>User reports</h3>
      </div>
      <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
        Reports from Flutter profile → Report user. After 3 open reports the user is flagged. Ban/suspend
        from Users page.
      </p>
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      <button type="button" className="btn-ghost" onClick={load} disabled={busy}>
        Refresh
      </button>
      <table className="data-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Reported</th>
            <th>Reporter</th>
            <th>Reason</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{r.reported_name || r.reported_username || r.reported_id}</td>
              <td>{r.reporter_name || r.reporter_id}</td>
              <td>{r.reason || "—"}</td>
              <td>{r.status}</td>
              <td>
                {r.status === "open" && (
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => resolve(r.id)}>
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                No user reports yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
