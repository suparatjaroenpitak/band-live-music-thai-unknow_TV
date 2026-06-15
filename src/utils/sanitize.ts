const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const UNSAFE_HTML = /[<>{}"'`]/g;

export function sanitizeInput(value: string, maxLength = 48) {
  return value.replace(CONTROL_CHARS, "").replace(UNSAFE_HTML, "").trim().slice(0, maxLength);
}

export function sanitizeFileName(value: string) {
  const cleaned = sanitizeInput(value, 80).replace(/[^a-z0-9ก-๙_-]+/gi, "-");
  return cleaned || "smart-music-studio";
}
