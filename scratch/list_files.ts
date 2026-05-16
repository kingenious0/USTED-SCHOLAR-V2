import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://wruymvxttqlxgcvwfcop.supabase.co',
  'sb_publishable_ecHTpdFSijEz8-mCP1rpbw_Gq1c6hUw'
)

async function listFiles() {
  console.log("📁 Listing files in L300_S1 storage...")
  const { data, error } = await supabase.storage
    .from('course-materials')
    .list('L300_S1')

  if (error) {
    console.error("❌ Error:", error)
    return
  }

  data.forEach(f => {
    console.log(`- ${f.name} (${(f.metadata.size / 1024 / 1024).toFixed(2)} MB)`)
  })
}

listFiles()
