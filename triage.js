const MONEY_WORDS = [
    'money', 'cash', 'pay', 'payment', 'transfer', 'loan', 'bank', 'upi', 'dirham', 'aed', 'rupee', '$',
  'paisa', 'paise', 'paisay', 'rupaye', 'rupay', 'udhar', 'udhaar', 'उधार', 'पैसे', 'पैसा', 'रुपये'
]

const URGENT_WORDS = [
  'urgent', 'emergency', 'asap', 'hospital', 'accident', 'help me', 'police', 'ambulance',
  'jaldi', 'turant', 'zaruri', 'zaroori', 'emergency', 'haspatal', 'जल्दी', 'तुरंत', 'ज़रूरी', 'जरूरी', 'अस्पताल'
]
const SHORT_MONEY_WORDS = ['rs', 'rup', 'inr', 'usd', 'gpay', 'paytm', 'phonepe']
const SENSITIVE_WORDS = ['otp', 'pin', 'cvv', 'password', 'passcode', 'aadhaar', 'aadhar']
function triage(text) {
    const t = text.toLowerCase()
    const tokens = t.split(/[^a-z0-9\u0900-\u097F]+/)
    for (const word of SHORT_MONEY_WORDS) {
        if (tokens.includes(word)) return { safe: false, reason: `money keyword: ${word}` }
  }
    for (const word of SENSITIVE_WORDS) {
        if (tokens.includes(word)) return { safe: false, reason: `sensitive keyword: ${word}` }
  }
    for (const word of MONEY_WORDS) {
        if (t.includes(word)) return { safe: false, reason: `money keyword: ${word}` }
    }
    for (const word of URGENT_WORDS) {
        if (t.includes(word)) return { safe: false, reason: `urgent keyword: ${word}` }
    }
    return {safe: true, reason: 'passed triage'}
    
}
module.exports = {triage}