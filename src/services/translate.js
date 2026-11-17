/**
 * Free, keyless translation via MyMemory (https://mymemory.translated.net).
 * Runs client-side. Best-effort: on any failure (offline, rate limit, etc.)
 * returns an empty string so the caller can fall back to manual entry rather
 * than crash the form.
 */
const MYMEMORY_CONTACT = "contact.kidmission@gmail.com";

export async function translateText(text, fromLang, toLang) {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  try {
    // `de` = contact email: raises MyMemory's free daily quota (developer
    // contact address only — never a user's email).
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${fromLang}|${toLang}&de=${encodeURIComponent(MYMEMORY_CONTACT)}`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    // When the quota is exhausted MyMemory still answers, but with a warning
    // text in place of the translation — treat that as a failure.
    if (Number(data?.responseStatus) !== 200) return "";
    const out = data?.responseData?.translatedText?.trim() || "";
    if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(out)) return "";
    return out;
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
  // Keyed on the French text itself (not the item id) so that editing a
  // mission's wording refreshes its EN/RU label instead of showing the old one.
  const key = `${lang}:${item.fr}`;
  if (cache[key]) return cache[key];
  const translated = await translateText(item.fr, "fr", lang);
  if (!translated) return item.fr; // don't cache failures: retry next time
  cache[key] = translated;
  saveCache(cache);
  return translated;
}
