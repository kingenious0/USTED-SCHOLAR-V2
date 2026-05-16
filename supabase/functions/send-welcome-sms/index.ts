import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WIGAL_API_KEY = Deno.env.get('WIGAL_API_KEY')
const WIGAL_USERNAME = Deno.env.get('WIGAL_USERNAME')
const SENDER_ID = 'USTEDSCHLR'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, name } = await req.json()

    if (!WIGAL_API_KEY || !WIGAL_USERNAME) {
      throw new Error('Missing Wigal credentials in backend')
    }

    // Ensure phone number starts with 233
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone
    }

    const message = `Welcome to USTED Scholar, ${name.split(' ')[0]}! 🎓 Your AI academic workspace is ready. Let's elevate your studies!`

    console.log(`Sending SMS to ${formattedPhone}...`)

    const response = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'USERNAME': WIGAL_USERNAME,
        'API-KEY': WIGAL_API_KEY
      },
      body: JSON.stringify({
        senderid: SENDER_ID,
        destinations: [
          {
            destination: formattedPhone,
            msgid: `WLCM_${Date.now()}`
          }
        ],
        message: message,
        smstype: 'text'
      })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
