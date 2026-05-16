import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://wruymvxttqlxgcvwfcop.supabase.co',
  'sb_publishable_ecHTpdFSijEz8-mCP1rpbw_Gq1c6hUw'
)

async function peekPdf() {
  const path = 'L300_S1/4nr73wnjrgy_1778966622749.pdf'
  console.log(`🕵️‍♂️ Peeking into storage file: ${path}`)
  
  const { data, error } = await supabase.storage
    .from('course-materials')
    .download(path)

  if (error) {
    console.error("❌ Download Error:", error)
    return
  }

  // We can't easily parse PDF in this script, but we can check the size and first few bytes
  console.log(`✅ Downloaded ${data.size} bytes.`)
}

peekPdf()
