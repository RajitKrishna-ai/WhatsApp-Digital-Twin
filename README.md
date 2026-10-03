# WhatsApp Digital Twin

A self-hosted WhatsApp bot that auto-replies in your own chatting style when you're busy or asleep — connects via your real WhatsApp number (QR code), not the Business API.

## Features
- Manual on/off via a command to yourself, with auto-expire safety net
- Group chats always excluded
- Safety triage: skips messages about money, urgency, or sensitive info (OTP, etc.)
- Replies match your real writing style, learned from your exported chat history
- Per-contact persona and tone
- Hindi/English (Hinglish) code-switching
- Confidence-gated sending — unsure replies are held as drafts, not sent
- Full logging, reviewable via a WhatsApp command

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Groq and Supabase keys
3. Copy `contacts.example.json` to `contacts.json` and add your contacts
4. Export a few WhatsApp chats (Chat → Export → Without Media) into a `chats/` folder
5. Run the style-building script to generate `style-profile.json`
6. `node index.js`, scan the QR code with WhatsApp

## Commands (send to yourself on WhatsApp)
- `/autoreply on` / `/autoreply off`
- `/autoreply log`

## Tech stack
Node.js, Baileys, Groq, Supabase
