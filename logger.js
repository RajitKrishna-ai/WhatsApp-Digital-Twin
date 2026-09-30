const fs = require('fs')

const LOG_FILE = 'logs.jsonl'

function logEvent(entry) {
    const line = JSON.stringify({time: new Date(). toISOString(), ...entry})
    fs.appendFileSync(LOG_FILE, line + '\n')
}

function readRecent(count =10) {
    try {
        const line = fs.readFileSync(LOG_FILE,'utf8').trim().split('\n').filter(Boolean)
        return line.slice(-count).map((l) => JSON.parse(l))
    } catch (err) {
        return []
    }
}
module.exports= {logEvent,readRecent}