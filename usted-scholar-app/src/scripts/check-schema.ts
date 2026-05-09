import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function checkSchema() {
  const { data, error } = await supabase.from('courses').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Available columns:', Object.keys(data[0] || {}));
  }
}

checkSchema();
