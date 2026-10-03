require('dotenv').config({ override: true })
const { supabase } = require('./db')

supabase
  .from('bot_state')
  .select('*')
  .then(({ data, error }) => console.log({ data, error }))