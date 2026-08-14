/**
 * Free, keyless translation via MyMemory (https://mymemory.translated.net).
 * Runs client-side. Best-effort: on any failure (offline, rate limit, etc.)
 * returns an empty string so the caller can fall back to manual entry rather
 * than crash the form.
 */
export async function translateText(text, fromLang, toLang) {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${fromLang}|${toLang}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.responseData?.translatedText?.trim() || "";
  } catch {
    return "";
  }
}
export const translateFrToHe = (text) => translateText(text, "fr", "he");
export const translateHeToFr = (text) => translateText(text, "he", "fr");

const CACHE_KEY = "kidmission_label_cache";

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

/**
 * Returns the display label for a catalog/custom item in the given language.
 * fr/he come straight from the stored data; en/ru are auto-translated from
 * the French text the first time they're needed, then cached in
 * localStorage so we don't re-call the API on every render.
 */
export async function getItemLabel(item, lang) {
  if (lang === "fr") return item.fr || item.he || "";
  if (lang === "he") return item.he || item.fr || "";
  const cache = loadCache();
  const key = `${lang}:${item.id || item.fr}`;
  if (cache[key]) return cache[key];
  const translated = await translateText(item.fr, "fr", lang);
  const label = translated || item.fr;
  cache[key] = label;
  saveCache(cache);
  return label;
}
