import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://wruymvxttqlxgcvwfcop.supabase.co',
  'sb_publishable_ecHTpdFSijEz8-mCP1rpbw_Gq1c6hUw'
)

async function debugTop() {
  const { data } = await supabase
    .from('courses')
    .select('id, name, storage_path, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log("📚 Top 5 Recent Courses:")
  data.forEach(c => {
    console.log(`- [${c.id}] ${c.name} -> ${c.storage_path}`)
  })
}

debugTop()
