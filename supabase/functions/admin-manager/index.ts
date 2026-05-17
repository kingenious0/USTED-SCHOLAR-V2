import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('MASTER_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  const supabase = createClient(supabaseUrl ?? '', serviceKey ?? '')

  try {
    const { action, userId } = await req.json()
    
    if (action === 'deleteUser') {
      console.log(`DELETING USER: ${userId}`);
      
      // 1. Delete from Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        return new Response(JSON.stringify({ 
          error: `Auth Deletion Failed: ${authError.message}`,
          details: authError
        }), { 
          status: 200, // Returning 200 so the frontend can read the body
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // 2. Delete from Profiles
      await supabase.from('profiles').delete().eq('id', userId)

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
