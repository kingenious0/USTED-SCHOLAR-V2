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
    // Test Groq with Streaming
    const groqRes = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        provider: 'groq',
        payload: {
          messages: [{ role: 'user', content: 'hello' }],
          model: 'llama-3.3-70b-versatile',
          stream: true
        }
      })
    });
    console.log(`Groq Stream Status: ${groqRes.status}`);
    const groqReader = groqRes.body;
    if (groqReader) {
      for await (const chunk of groqReader) {
        const text = new TextDecoder().decode(chunk as any);
        console.log(`Groq Chunk:`, text);
      }
    }

    // Test Gemini with Streaming
    const geminiRes = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        provider: 'gemini',
        payload: {
          contents: [{ parts: [{ text: 'hello' }] }],
          model: 'gemini-2.5-flash-lite',
          stream: true
        }
      })
    });
    console.log(`Gemini Stream Status: ${geminiRes.status}`);
    const geminiReader = geminiRes.body;
    if (geminiReader) {
      for await (const chunk of geminiReader) {
        const text = new TextDecoder().decode(chunk as any);
        console.log(`Gemini Chunk:`, text);
      }
    }

  } catch (err: any) {
    console.error('❌ Request error:', err.message);
  }
}

test();
