const rawGoogle =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || "";

export const GOOGLE_WEB_CLIENT_ID = (
  String(rawGoogle).split(",")[0].trim() ||
  "470949991659-kq78v41kdm7ut9ivie0ul634hgj8bgd7.apps.googleusercontent.com"
).trim();

export const API_BASE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://127.0.0.1:8000"
)
  .toString()
  .replace(/\/$/, "");

/** Flutter AppStyles dark palette */
export const theme = {
  bg: "#0B0A12",
  elevated: "#12101A",
  card: "#1A1625",
  field: "#221C30",
  border: "#2E2640",
  purple: "#8B5CF6",
  purpleBright: "#A78BFA",
  purpleDeep: "#7C3AED",
  purpleDim: "#2A1F3D",
  text: "#F5F3FF",
  muted: "#A89BB8",
  danger: "#FF6B6B",
  amber: "#FBBF24",
};
