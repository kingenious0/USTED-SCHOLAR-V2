import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the correct .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('🔎 Querying course "METHODS OF TEACHING"...');
  console.log('URL:', supabaseUrl);
  
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, file_id, storage_path, full_text, synthesis')
    .ilike('name', '%Methods of Teaching%')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Supabase error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('❌ No course found with that name in database.');
    return;
  }
  
  console.log(`✅ Found ${data.length} course(s):`);
  data.forEach((c, idx) => {
    console.log(`\n--- Course ${idx + 1} ---`);
    console.log(`ID:`, c.id);
    console.log(`Name:`, c.name);
    console.log(`File ID:`, c.file_id);
    console.log(`Storage Path:`, c.storage_path);
    console.log(`Full Text Length:`, c.full_text?.length || 0, 'characters');
    console.log(`Synthesis Length:`, c.synthesis?.length || 0, 'characters');
    if (c.synthesis) {
      console.log(`Synthesis Snippet:`, c.synthesis.slice(0, 150) + '...');
    }
  });
}

inspect();
