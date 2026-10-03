const { supabase } = require('./db')

async function logEvent(entry) {
  const { error } = await supabase.from('logs').insert(entry)
  if (error) console.log('⚠️ Could not save log:', error.message)
}

async function readRecent(count = 10) {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(count)

  if (error) {
    console.log('⚠️ Could not read logs:', error.message)
    return []
  }
  return data.reverse().map((row) => ({ ...row, time: row.created_at }))
}

module.exports = { logEvent, readRecent }