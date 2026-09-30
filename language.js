const HINGLISH_MARKERS = [
  'hai', 'hain', 'ho', 'kya', 'kyun', 'kyu', 'nahi', 'nahin', 'haan', 'han',
  'kar', 'karo', 'karna', 'raha', 'rahi', 'rahe', 'bhai', 'yaar', 'bhi',
  'tha', 'thi', 'the', 'kaise', 'kaisa', 'kaisi', 'accha', 'acha', 'theek',
  'matlab', 'abhi', 'kal', 'aaj', 'mera', 'meri', 'tera', 'teri', 'apna'
]

function detectLanguage(text) {
  const hasDevanagari = /[\u0900-\u097F]/.test(text)
  const tokens = text.toLowerCase().split(/[^a-z0-9\u0900-\u097F]+/).filter(Boolean)
  const hinglishHits = tokens.filter((t) => HINGLISH_MARKERS.includes(t)).length
  const hinglishRatio = tokens.length ? hinglishHits / tokens.length : 0

  if (hasDevanagari) return 'hindi-script'
  if (hinglishRatio > 0.15) return 'hinglish'
  return 'english'
}

module.exports = { detectLanguage }