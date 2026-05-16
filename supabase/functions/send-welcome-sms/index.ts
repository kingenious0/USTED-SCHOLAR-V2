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

    // Format phone
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone
    }

    const message = `Welcome to USTED Scholar, ${name}! Your professional academic workspace is ready. Let's craft excellence together. 🎓🚀`

    const params = new URLSearchParams({
      username: WIGAL_USERNAME ?? '',
      api_key: WIGAL_API_KEY ?? '',
      sender_id: SENDER_ID,
      dest: formattedPhone,
      msg: message
    });

    const wigalUrl = `https://frogapi.wigal.com.gh/v2/send_sms?${params.toString()}`

    console.log(`📡 Triggering Wigal for ${formattedPhone}...`)
    
    const response = await fetch(wigalUrl)
    const contentType = response.headers.get("content-type")

    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json()
    } else {
      const text = await response.text()
      console.error('Wigal sent non-JSON response:', text)
      throw new Error(`Wigal API Error (HTML Response): ${text.substring(0, 100)}...`)
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
      status: 200, // Return 200 to keep the frontend from crashing
    })
  }
})
