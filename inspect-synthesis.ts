import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import fetch from 'node-fetch'; // Polyfill fetch for node

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const GATEWAY_URL = 'https://wruymvxttqlxgcvwfcop.supabase.co/functions/v1/ai-gateway';

async function test() {
  const courseId = '28a9f5a4-618b-4885-a4bc-4ae6ed1a9fa7';
  console.log(`🧪 Testing AI Synthesis for course ID: ${courseId}`);

  // 1. Fetch course details
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    console.error('❌ Failed to fetch course:', error?.message);
    return;
  }

  console.log(`✅ Retrieved course Name: "${course.name}"`);
  console.log(`Full Text Length: ${course.full_text?.length || 0} characters`);
  console.log(`Current Synthesis Length: ${course.synthesis?.length || 0} characters`);

  if (!course.full_text) {
    console.error('❌ Error: full_text is empty! AI needs text to write a synthesis.');
    return;
  }

  // 2. Mock performSynthesis
  console.log('⚡ Dispatched query to Cerebras AI Gateway...');
  
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}` // use anon key
      },
      body: JSON.stringify({
        provider: 'cerebras',
        payload: {
          messages: [
            { role: 'system', content: `You are the USTED Scholar AI. Senior Academic Mentor.` },
            { role: 'user', content: course.full_text.substring(0, 10000) } // Send a small subset to test
          ],
          model: 'llama3.1-8b',
          stream: false // Turn off stream to get clean json response in Node
        }
      })
    });

    console.log(`Gateway Response Status: ${response.status} ${response.statusText}`);
    const resText = await response.text();
    console.log(`Gateway Response:\n`, resText);

  } catch (err: any) {
    console.error('❌ Request error:', err.message);
  }
}

test();
