import { API_BASE_URL } from "./config";

const TOKEN_KEY = "novelhub_web_token";

export { API_BASE_URL };

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function resolveAssetUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:)/i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith("/uploads") || p.startsWith("/api/")) return `${API_BASE_URL}${p}`;
  if (path.includes(".") && !path.includes("/api/")) {
    const name = path.split("/").pop();
    return `${API_BASE_URL}/uploads/${name}`;
  }
  return `${API_BASE_URL}${p}`;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.detail || data.message || msg;
      if (Array.isArray(msg)) msg = msg.map((m) => m.msg || JSON.stringify(m)).join(", ");
    } catch {
      try {
        msg = (await res.text()) || msg;
      } catch {
        /* ignore */
      }
    }
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getBootstrap() {
  return request("/api/bootstrap");
}
export function getContentVersion() {
  return request("/api/content/version");
}
export function getMe() {
  return request("/api/me");
}
export function guestLogin() {
  return request("/api/auth/guest", {
    method: "POST",
    body: JSON.stringify({ device_id: `web-${crypto.randomUUID?.() || Date.now()}` }),
  });
}
export function emailAuth({ email, display_name = "", password = "", username = "", mode = "login" }) {
  return request("/api/auth/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      display_name: display_name || username || email.split("@")[0],
      password,
      username: username || undefined,
      mode: mode === "register" || mode === "signup" ? "register" : "login",
    }),
  });
}
export function googleAuth({ id_token, access_token }) {
  return request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token, access_token }),
  });
}

export function getBook(id) {
  return request(`/api/books/${id}`);
}
export function getBookChapters(storyId) {
  return request(`/api/write/stories/${storyId}/chapters`);
}
export function getBookReviews(bookId) {
  return request(`/api/books/${bookId}/reviews`).catch(() => ({ items: [] }));
}
export function postBookReview(bookId, { rating, comment }) {
  return request(`/api/books/${bookId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}
export function likeBook(bookId) {
  return request(`/api/books/${bookId}/like`, { method: "POST", body: "{}" });
}
export function unlikeBook(bookId) {
  return request(`/api/books/${bookId}/like`, { method: "DELETE" });
}
export function getBookLike(bookId) {
  return request(`/api/books/${bookId}/like`).catch(() => ({ liked: false }));
}

export function getLibrary() {
  return request("/api/library").catch(() => ({ items: [] }));
}
export function getReadingLists() {
  return request("/api/reading-lists").catch(() => ({ items: [] }));
}
export async function addToReadingList(bookId) {
  const lists = await getReadingLists();
  const items = lists?.items || lists || [];
  let listId = items[0]?.id;
  if (!listId) {
    const created = await request("/api/reading-lists", {
      method: "POST",
      body: JSON.stringify({ name: "Reading List", story_count: 0, sort_order: 0 }),
    });
    listId = created?.id;
  }
  if (!listId) throw new Error("Could not create reading list");
  return request(`/api/reading-lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify({ book_id: Number(bookId) }),
  });
}

export function getMyStories() {
  return request("/api/write/stories").catch(() => ({ items: [] }));
}
export function createStory(payload = {}) {
  return request("/api/write/stories", {
    method: "POST",
    body: JSON.stringify({
      title: (payload.title || "Untitled Story").trim() || "Untitled Story",
      author: (payload.author || "Author").trim() || "Author",
      description: payload.description != null ? String(payload.description) : "",
      genre: (payload.genre || "Romance").trim() || "Romance",
      cover_path: payload.cover_path || "",
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      status_text: payload.status_text || "Draft",
    }),
  });
}
export function updateStory(storyId, payload) {
  return request(`/api/write/stories/${storyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export function deleteStory(storyId) {
  return request(`/api/write/stories/${storyId}`, { method: "DELETE" });
}
export function createChapter(storyId, payload = {}) {
  return request(`/api/write/stories/${storyId}/chapters`, {
    method: "POST",
    body: JSON.stringify({
      title: (payload.title || "Chapter 1").trim() || "Chapter 1",
      content: payload.content != null ? String(payload.content) : "",
      chapter_number: payload.chapter_number ?? null,
      submission_status: payload.submission_status || "draft",
    }),
  });
}
export function updateChapter(chapterId, payload) {
  return request(`/api/write/chapters/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getNotifications(tab) {
  const q = tab ? `?tab=${encodeURIComponent(tab)}` : "";
  return request(`/api/notifications${q}`).catch(() => ({ items: [] }));
}
export function getMyActivity() {
  return request("/api/me/activity").catch(() => ({ items: [] }));
}
export function searchStories(q, genre) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (genre) params.set("genre", genre);
  return request(`/api/search?${params.toString()}`);
}
export function listGenres() {
  return request("/api/genres").catch(() => ({ items: [] }));
}
export function getGenreBooks(name, sort) {
  const q = sort ? `?sort=${encodeURIComponent(sort)}` : "";
  return request(`/api/genres/${encodeURIComponent(name)}/books${q}`);
}
export function getUserProfile(userId) {
  return request(`/api/users/${userId}`).catch(() => null);
}
export function followAuthor(authorId) {
  return request(`/api/authors/${authorId}/follow`, { method: "POST", body: "{}" });
}
export function getChapterComments(bookId, chapterNumber) {
  return request(`/api/books/${bookId}/chapters/${chapterNumber}/comments`).catch(() => ({
    items: [],
  }));
}
export function postChapterComment(bookId, chapterNumber, { body, paragraph_index }) {
  return request(`/api/books/${bookId}/chapters/${chapterNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body, paragraph_index }),
  });
}
