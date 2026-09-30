require('dotenv').config()
const { default: makeWASocket, useMultiFileAuthState, jidNormalizedUser } = require('@whiskeysockets/baileys')
const pino = require('pino')
const config = require('./config')
const {generateReply}= require('./llm')
let autoReplyEnabled = false
const fs = require('fs')
const {triage} = require('./triage')
const {logEvent, readRecent} =require('./logger')
const styleProfiles = JSON.parse(fs.readFileSync('style-profile.json', 'utf8'))
const {detectLanguage} = require('./language')

function loadContacts() {
    try {
        return JSON.parse( fs.readFileSync('contacts.json','utf8'))
    }   catch(err) {
        console.log('⚠️ Could not read contacts.json:', err.message)
        return{}
    }
}

function styleInstruction(profile) {
    if(!profile) {
        return 'Keep replies simple and clean and short'
    }
    const s= profile.stats 
    const emojiLine = s.emojiPct > 15 ? `Use emoji like ${s.topEmojis.slice(0, 3).join(' ')} occasionally.` : 'Use emoji rarely.'
    const punctLine = s.endsWithPunctPct < 15 ?'Do not end messages with a period, question mark, or exclamation mark.' : ''
    const caseLine = s.lowercaseStartPct < 10 ? 'Start sentences with a capital letter.' : 'Start sentences in lowercase, casual style.'
    return [
         `Typical message length: around ${s.medianChars} characters. Keep it close to that unless the question needs more.`,
        emojiLine,
        punctLine,
        caseLine,
        'Examples of how this person actually writes:',
        ...profile.samples.map((m) => `- ${m}`)
    ]
        .filter(Boolean)
        .join('\n')
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update

    if (qr) {
      const qrcode = require('qrcode-terminal')
      qrcode.generate(qr, { small: true })
      console.log('Scan this QR code with WhatsApp on your phone')
    }

    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp')
    }

    if (connection === 'close') {
      const statusCode = update.lastDisconnect?.error?.output?.statusCode
      console.log('❌ Connection closed. Status code:', statusCode)

      if (statusCode !== 401) {
        console.log('Reconnecting...')
        startBot()
      } else {
        console.log('Logged out — delete auth_info and re-scan QR')
      }
    }
  })

  sock.ev.on('messages.upsert', async(m) => {
    const msg = m.messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid

    if (from.endsWith('@g.us')) {
      return
    }

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
    const isFromMe = msg.key.fromMe

    const myJids = [jidNormalizedUser(sock.user.id), jidNormalizedUser(sock.user.lid)]
    const isSelfChat = myJids.includes(from)

    if (isSelfChat && text === '/autoreply on') {
      enableAutoReply(() => {
        sock.sendMessage(from, {text: '⏰ Auto-reply expired and is now OFF' })
      })
      console.log(`🟢 Auto-reply ENABLED (expires in ${config.AUTO_EXPIRE_HOURS}h)`)
      sock.sendMessage(from, { text: `🟢 Auto-reply ON (expires in ${config.AUTO_EXPIRE_HOURS}h)` })
      return
    }

    if (isSelfChat && text === '/autoreply off') {
      disableAutoReply()
      console.log('🔴 Auto-reply DISABLED')
      sock.sendMessage(from, {text:'🔴 Auto-reply OFF' })
      return
    }

    if (isSelfChat && text ==='/autoreply log') {
        const entries = readRecent(10)
        const icons ={sent: '✅', skipped: '⏭️', error: '⚠️' }

        const body = entries.length
        ? entries
            .map((e) => {
                const time = new Date(e.time).toLocaleString('en-GB',{
                    timeZone: config.TIMEZONE,
                    hour12:false
                })
                return `${icons[e.action] || '•'} ${time} | ${e.contact} | ${e.reason}\n"${e.message}"`
            })
            .join('\n\n')
        : 'No log entries yet'
        await sock.sendMessage(from , {text: body})
        return
    }

    if (isFromMe || isSelfChat) return
    if (m.type !== 'notify') return
    if (!text || !autoReplyEnabled) return

    const contacts = loadContacts()
    const contact  = contacts[from]
    const profile = contact.styleFile ? styleProfiles[contact.styleFile] : null
    if (!contact) {
        console.log(`⏭️ Skipped (unknown contact): ${from}`)
        logEvent({action: 'skipped', contact: from, reason:'unknown cotact', message:text})
        return
    }

    const verdict = triage(text)
    if(!verdict.safe) {
        console.log(`⏭️ Skipped (${verdict.reason}) from ${contact.name}`)
        logEvent({action: 'skipped',contact: contact.name, reason: verdict.reason, message:text})
        return
    }

    const last = lastReplyAt.get(from)
    const cooldownMs = config.REPLY_COOLDOWN_MINUTES * 60 * 1000
    if (last && Date.now() - last < cooldownMs) {
        console.log(`⏭️ Skipped (cooldown) from ${contact.name}`)
        logEvent({ action: 'skipped', contact: contact.name, reason: 'cooldown', message: text })
        return
    }
    lastReplyAt.set(from, Date.now())

    try {
        const lang = detectLanguage(text)
        const result = await generateReply([
            {
                role: 'system',
                content: `You are replying to a WhatsApp message on behalf of Rajit, who is busy right now. You are replying to: ${contact.persona || 'someone Rajit knows'}. Write exactly the way Rajit writes, matching the style below. The incoming message is in ${lang === 'hinglish' ? 'Hinglish (Roman-script Hindi mixed with English)' : lang === 'hindi-script' ? 'Hindi (Devanagari script)' : 'English'}. Reply in the same language mix. Never make promises or commitments.\n\n${styleInstruction(profile)}`
            },
            {
                role: 'user',
                content: `Message: "${text}"\n\nRespond with a JSON object with exactly two fields: "reply" (your reply text, following all the style rules above) and "confidence" (a number from 0 to 1 for how well your reply matches Rajit's real style and would fit this exact situation).`
            }
        ])

        if (result.confidence >= config.CONFIDENCE_THRESHOLD) {
            await sock.sendMessage(from, { text: result.reply })
            console.log(`🤖 Replied to ${from} (confidence ${result.confidence}): ${result.reply}`)
            logEvent({ action: 'sent', contact: contact.name, reason: verdict.reason, message: text, reply: result.reply, confidence: result.confidence })
        } else {
            console.log(`✋ Held draft for ${contact.name} (confidence ${result.confidence}): ${result.reply}`)
            logEvent({ action: 'held', contact: contact.name, reason: `low confidence: ${result.confidence}`, message: text, reply: result.reply, confidence: result.confidence })
        }
    } catch (err) {
        console.log('⚠️ Reply failed:', err.message)
        logEvent({ action: 'error', contact: contact.name, reason: err.message, message: text })
    }

    console.log(`📩 From: ${from} | fromMe: ${isFromMe} | autoReplyEnabled: ${autoReplyEnabled}`)
    console.log(`Text: ${text}`)
  })
}

startBot()

let expireTimer = null
const lastReplyAt = new Map()
function enableAutoReply(onExpire) {
    autoReplyEnabled = true
    clearTimeout(expireTimer)
    expireTimer = setTimeout (() => {
        autoReplyEnabled = false
        console.log('⏰ Auto-reply expired automatically')
        if (onExpire) onExpire()
    }, config.AUTO_EXPIRE_HOURS  *60*60*1000)
}
function disableAutoReply() {
    autoReplyEnabled = false
    clearTimeout(expireTimer)
}