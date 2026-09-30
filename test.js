const { detectLanguage } = require('./language')
const samples = ['Hey how are you', 'Kya kar raha hai bhai', 'तुम कैसे हो', 'Dinner at 8?', 'kal milte hai yaar']
for (const s of samples) console.log(s, '=>', detectLanguage(s))