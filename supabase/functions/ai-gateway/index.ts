import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const CEREBRAS_API_KEY = Deno.env.get('CEREBRAS_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { provider, payload } = await req.json()

    let url = ''
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    let apiKey = ''

    if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions'
      apiKey = GROQ_API_KEY || ''
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (provider === 'cerebras') {
      url = 'https://api.cerebras.ai/v1/chat/completions'
      apiKey = CEREBRAS_API_KEY || ''
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (provider === 'gemini') {
      const geminiKey = GEMINI_API_KEY || ''
      const method = payload.stream ? 'streamGenerateContent' : 'generateContent'
      url = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:${method}?key=${geminiKey}`
      delete payload.model
    }

    if (!apiKey && provider !== 'gemini') throw new Error(`Missing ${provider} API key`)

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    // --- SECURE STREAMING BRIDGE ---
    const { readable, writable } = new TransformStream()
    response.body?.pipeTo(writable)

    return new Response(readable, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': response.headers.get('Content-Type') || 'text/event-stream' 
      },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
