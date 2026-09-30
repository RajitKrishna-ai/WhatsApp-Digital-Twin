function analyze(messages) {
  const total = messages.length
  const lengths = messages.map((t) => t.length).sort((a, b) => a - b)
  const pct = (n) => Math.round((n / total) * 100)

  const emojiCounts = {}
  let withEmoji = 0
  for (const t of messages) {
    const found = t.match(/\p{Extended_Pictographic}/gu) || []
    if (found.length) withEmoji++
    for (const e of found) emojiCounts[e] = (emojiCounts[e] || 0) + 1
  }
  const topEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emoji]) => emoji)

  const lower = messages.filter((t) => /^\p{Ll}/u.test(t)).length
  const upper = messages.filter((t) => /^\p{Lu}/u.test(t)).length

  return {
    count: total,
    avgChars: Math.round(lengths.reduce((a, b) => a + b, 0) / total),
    medianChars: lengths[Math.floor(total / 2)],
    shortPct: pct(messages.filter((t) => t.length <= 20).length),
    emojiPct: pct(withEmoji),
    topEmojis,
    lowercaseStartPct: lower + upper ? Math.round((lower / (lower + upper)) * 100) : null,
    endsWithPunctPct: pct(messages.filter((t) => /[.!?]$/.test(t.trim())).length)
  }
}
function sampleMessages(messages, count = 8) {
  const mid = messages.filter((t) => t.length >= 10 && t.length <= 60)
  const pool = mid.length >= count ? mid : messages
  const step = Math.max(1, Math.floor(pool.length / count))
  const picked = []
  for (let i = 0; i < pool.length && picked.length < count; i += step) {
    picked.push(pool[i])
  }
  return picked
}
module.exports = { analyze, sampleMessages  }