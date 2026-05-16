import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://wruymvxttqlxgcvwfcop.supabase.co',
  'sb_publishable_ecHTpdFSijEz8-mCP1rpbw_Gq1c6hUw'
)

async function findNetworking() {
  console.log("🕵️‍♂️ Hunting for the Networking phantom...")
  
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, meta_tag, synthesis, full_text')
    .or('synthesis.ilike.%Bus Network%,full_text.ilike.%Bus Network%')

  if (error) {
    console.error("❌ Error:", error)
    return
  }

  console.log(`📊 Found ${data.length} sources of Networking text:`)
  data.forEach(c => {
    console.log(`- [${c.id}] ${c.name} (${c.meta_tag})`)
  })
}

findNetworking()
