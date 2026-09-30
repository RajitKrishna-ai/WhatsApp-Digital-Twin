const config = require('./config')

const providers ={
    groq: async (messages) => {
        const res = await fetch ('https://api.groq.com/openai/v1/chat/completions', {
            method : "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
            body: JSON.stringify({
                model: config.GROQ_MODEL,
                messages,
                response_format:{ type: 'json_object'}
            })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Groq request failed')
        return JSON.parse(data.choices[0].message.content)
    }
}
async function generateReply(messages) {
    const provider = providers[config.LLM_PROVIDER]
    if (!provider) throw new Error ("unknow LLM provider: ${config.LLM_PROVIDER}")
        return provider(messages)
}
module.exports ={generateReply}