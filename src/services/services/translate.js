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
