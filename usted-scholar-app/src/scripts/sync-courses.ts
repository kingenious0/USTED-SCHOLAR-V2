import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'course-materials';
const DEFAULT_PROGRAM = 'IT Education';

async function sync() {
  console.log('🚀 Starting Deep-Scan Super-Sync...');
  
  const KNOWN_FILE = 'Computer Networking Essentials sem2.pdf';
  const PATH_VARIATIONS = [
    'ITE SEMESTER 2',
    'ITE Semester 2',
    'ITE-SEMESTER-2',
    'ite semester 2'
  ];

  let foundFolder = '';
  let discoveredFiles: any[] = [];

  for (const folder of PATH_VARIATIONS) {
    console.log(`🔎 Checking folder: '${folder}'...`);
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder);
    
    if (!error && data && data.length > 0) {
      console.log(`✅ SUCCESS! Found ${data.length} files in '${folder}'`);
      foundFolder = folder;
      discoveredFiles = data;
      break;
    }
  }

  if (!foundFolder) {
    console.log('❌ Could not find files via list(). Trying direct download test...');
    const testPath = `ITE SEMESTER 2/${KNOWN_FILE}`;
    const { data: testData, error: testError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(testPath);

    if (testError) {
      console.error(`❌ Direct download failed for '${testPath}':`, testError.message);
      return;
    } else {
      console.log(`✅ Direct download worked! Casing matches 'ITE SEMESTER 2'.`);
      foundFolder = 'ITE SEMESTER 2';
      discoveredFiles = [{ name: KNOWN_FILE, id: 'manual-sync' }];
    }
  }

  const { data: existingCourses } = await supabase.from('courses').select('storage_path');
  const existingPaths = new Set(existingCourses?.map(c => c.storage_path) || []);

  let addedCount = 0;
  for (const file of discoveredFiles) {
    if (file.id === null && file.name !== KNOWN_FILE) continue; 
    
    const fullPath = `${foundFolder}/${file.name}`;
    if (existingPaths.has(fullPath)) {
        console.log(`⏭️ Skipping '${file.name}' (Already in DB)`);
        continue;
    }

    console.log(`➕ Syncing: '${file.name}'`);

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, "") 
      .replace(/[_-]/g, " ")     
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const { error: insertError } = await supabase
      .from('courses')
      .insert({
        name: cleanTitle,
        title: cleanTitle,
        file_id: file.id || file.name,
        storage_path: fullPath,
        program: DEFAULT_PROGRAM,
        meta_tag: 'CORE'
      });

    if (insertError) {
      console.error(`❌ Insert failed for '${file.name}':`, insertError.message);
    } else {
      addedCount++;
    }
  }

  console.log(`\n✅ Sync Complete! Added ${addedCount} new courses.`);
}

sync();
