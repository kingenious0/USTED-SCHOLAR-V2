import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, name } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: 'Phone number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const WIGAL_API_KEY = Deno.env.get('WIGAL_API_KEY');
    const WIGAL_USERNAME = Deno.env.get('WIGAL_USERNAME');
    const SENDER_ID = Deno.env.get('WIGAL_SENDER_ID') || 'USTEDSCHLR';

    if (!WIGAL_API_KEY || !WIGAL_USERNAME) {
      return new Response(JSON.stringify({
        success: false,
        error: 'SMS service not configured. Set WIGAL_API_KEY and WIGAL_USERNAME environment variables.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1)
    } else if (formattedPhone.startsWith('2330')) {
      formattedPhone = '233' + formattedPhone.substring(4)
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone
    }

    const message = `Welcome to USTED Scholar, ${name}! Your professional academic workspace is ready. Join the community now: https://chat.whatsapp.com/DRinAaouI5y9K0DvYyu1E1`

    const body = {
      senderid: SENDER_ID,
      destinations: [
        {
          destination: formattedPhone,
          msgid: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        }
      ],
      message: message,
      smstype: "text"
    }

    const wigalUrl = `https://frogapi.wigal.com.gh/api/v3/sms/send`

    console.log(`Dispatching SMS to: ${formattedPhone} using Sender ID: ${SENDER_ID}`)

    const response = await fetch(wigalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': WIGAL_API_KEY,
        'USERNAME': WIGAL_USERNAME,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(body)
    })

    const text = await response.text()
    console.log("Raw SMS Response:", text)

    let result;
    if (response.ok && !text.startsWith("<!")) {
      result = JSON.parse(text)
    } else {
      result = {
        status: 'SERVER_GATEWAY_REJECTION',
        message: 'The gateway returned a non-JSON code response.',
        rawSnippet: text.substring(0, 150)
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('SMS Edge Function Failure:', error.message)
    return new Response(JSON.stringify({
      error: error.message,
      status: 'CRITICAL_FAILURE'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
