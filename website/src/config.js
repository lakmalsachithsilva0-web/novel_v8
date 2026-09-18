/**
 * Public frontend config.
 * Google Web client IDs are not secrets — they are meant to be in the browser.
 * Security is enforced by Authorized JavaScript origins in Google Cloud Console.
 */

// Prefer Vite env; fall back to your Web OAuth client so Google always works locally
// even if website/.env is missing or in the wrong folder.
const rawGoogle =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
  "";

export const GOOGLE_WEB_CLIENT_ID = (
  String(rawGoogle).split(",")[0].trim() ||
  "470949991659-kq78v41kdm7ut9ivie0ul634hgj8bgd7.apps.googleusercontent.com"
).trim();

export const API_BASE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://127.0.0.1:8000"
)
  .toString()
  .replace(/\/$/, "");
