const fs = require('fs')

// const LINE = /^\[(\d{1,2}:\d{2}\s?[ap]m), (\d{1,2}\/\d{1,2}\/\d{4})\] ([^:]+): (.*)$/i
const LINE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}(?::\d{2})?\s?[ap]m)\] ([^:]+): (.*)$/i
const SKIP = /(image|video|audio|sticker|document|gif) omitted|this message was deleted/i

function parseChat(file, myNames) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\u200e/g, '')
  const mine = []
  let current = null

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(LINE)
    if (m) {
    //   current = m[3].trim() === myNames ? { text: m[4] } : null
        current = myNames.includes(m[3].trim()) ? { text: m[4] } : null
      if (current) mine.push(current)
    } else if (current) {
      current.text += '\n' + line
    }
  }
  return mine.map((x) => x.text).filter((t) => !SKIP.test(t))
}

// module.exports = { parseChat }
module.exports = { parseChat, LINE }
