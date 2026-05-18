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
  const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY');
  
  const supabase = createClient(supabaseUrl ?? '', serviceKey ?? '')

  try {
    const { action, userId, fileId, storagePath } = await req.json()
    
    if (action === 'deleteUser') {
      console.log(`DELETING USER: ${userId}`);
      
      // 1. Delete from Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        return new Response(JSON.stringify({ 
          error: `Auth Deletion Failed: ${authError.message}`,
          details: authError
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // 2. Delete from Profiles
      await supabase.from('profiles').delete().eq('id', userId)

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'parseDocument') {
      console.log(`PROCESSING SCANNED PDF VIA UNSTRUCTURED.IO: ${storagePath} (fileId: ${fileId})`);
      
      if (!storagePath || !fileId) {
        throw new Error("Missing storagePath or fileId parameters.");
      }

      if (!UNSTRUCTURED_API_KEY) {
        throw new Error("Missing UNSTRUCTURED_API_KEY environment variable on Supabase backend.");
      }

      // 1. Fetch the PDF binary directly from Supabase Storage
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('course-materials')
        .download(storagePath);
      
      if (downloadError || !fileBlob) {
        throw new Error(`Failed to download PDF from storage bucket: ${downloadError?.message || 'Empty file'}`);
      }

      // 2. Prepare high-performance multipart form payload
      const formData = new FormData();
      formData.append('files', fileBlob, 'document.pdf');
      formData.append('strategy', 'hi_res');
      formData.append('split_pdf_page', 'true');
      formData.append('split_pdf_concurrency_level', '10');

      // 3. Dispatch to Unstructured.io (Native Fetch)
      console.log("Sending payload to Unstructured.io General API...");
      const unstructuredResponse = await fetch('https://api.unstructuredapp.io/general/v0/general', {
        method: 'POST',
        headers: {
          'unstructured-api-key': UNSTRUCTURED_API_KEY
        },
        body: formData
      });

      // --- ERROR SHIELD: HTML Code 60 Cloudflare / Gateway Interceptor ---
      const responseText = await unstructuredResponse.text();
      if (responseText.startsWith("<!DOCTYPE") || responseText.startsWith("<html")) {
        throw new Error("Received an HTML gateway timeout/error from Unstructured.io. Please check API Key or try again later.");
      }

      if (!unstructuredResponse.ok) {
        throw new Error(`Unstructured API returned error status ${unstructuredResponse.status}: ${responseText}`);
      }

      const elements = JSON.parse(responseText);
      if (!Array.isArray(elements)) {
        throw new Error("Unstructured.io returned an unexpected response format (not a JSON array).");
      }

      // 4. Stitch layout elements into beautiful structured text
      const cleanText = elements
        .map((el: any) => el.text || '')
        .filter((text: string) => text.trim().length > 0)
        .join('\n');

      if (!cleanText || cleanText.trim().length === 0) {
        throw new Error("Failed to extract any text elements from the document.");
      }

      console.log(`Successfully extracted ${cleanText.length} characters of clean text DNA!`);

      // 5. Commit text directly to permanent courses.full_text neural cache
      const { error: dbError } = await supabase
        .from('courses')
        .update({ full_text: cleanText })
        .eq('file_id', fileId);

      if (dbError) {
        throw new Error(`Database cache update failed: ${dbError.message}`);
      }

      console.log(`Successfully stored full_text cache in DB for file_id: ${fileId}!`);

      return new Response(JSON.stringify({ success: true, characterCount: cleanText.length }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error: any) {
    console.error(`Edge Function execution error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
