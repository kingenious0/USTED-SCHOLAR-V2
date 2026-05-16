import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, name } = await req.json()
    
    const WIGAL_API_KEY = Deno.env.get('WIGAL_API_KEY')
    const WIGAL_USERNAME = Deno.env.get('WIGAL_USERNAME')
    const SENDER_ID = "USTEDSCHLR"

    // Format phone to local format or 233
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      // Keep leading zero if that's what the gateway prefers
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone
    }

    const message = `Welcome to USTED Scholar, ${name}! Your professional academic workspace is ready. Let's craft excellence together. 🎓🚀`

    // EXACT FROG API V3 PAYLOAD STRUCTURE 🐸
    const body = {
      senderid: SENDER_ID,
      destinations: [
        {
          destination: formattedPhone,
          msgid: `MSG_${Date.now()}`
        }
      ],
      message: message,
      smstype: "text" // MUST BE STRING "text"
    }

    const wigalUrl = `https://frogapi.wigal.com.gh/api/v3/sms/send`

    console.log(`📡 Sending Frog API V3 Payload to ${formattedPhone}...`)
    
    const response = await fetch(wigalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': WIGAL_API_KEY ?? '',
        'USERNAME': WIGAL_USERNAME ?? ''
      },
      body: JSON.stringify(body)
    })

    const contentType = response.headers.get("content-type")
    let result;

    if (contentType && contentType.includes("application/json")) {
      result = await response.json()
    } else {
      const text = await response.text()
      console.error('Wigal Response (Non-JSON):', text)
      result = { status: 'RAW_RESPONSE', raw: text.substring(0, 200) }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Final SMS Function Error:', error.message)
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'CRITICAL_FAILURE'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
