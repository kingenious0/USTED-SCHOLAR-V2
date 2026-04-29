import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Multi-Key Management
const API_KEYS = [
  import.meta.env.VITE_GEMINI_1_API_KEY,
  import.meta.env.VITE_GEMINI_2_API_KEY,
  import.meta.env.VITE_GEMINI_3_API_KEY,
  import.meta.env.VITE_GEMINI_4_API_KEY
].filter(Boolean);

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

let currentKeyIndex = 0;

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_WEBAPP_URL;
const APPS_SCRIPT_SECRET = import.meta.env.VITE_APPS_SCRIPT_SECRET;

// Helper: Fetch PDF from Google Drive
async function fetchPdfBase64(fileId: string): Promise<string | null> {
  if (!APPS_SCRIPT_URL) return null;
  const scriptUrl = `${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`;
  try {
    const response = await fetch(scriptUrl, {
      redirect: 'follow',
      headers: { 'Accept': 'text/plain' },
    });
    if (!response.ok) return null;
    const base64Data = await response.text();
    if (!base64Data || base64Data.startsWith('Error') || base64Data.includes('<!doctype')) return null;
    return base64Data.trim();
  } catch (e) {
    console.error('AI PDF fetch error:', e);
    return null;
  }
}

// Service: Generate Synthesis with CACHING & GROQ BOOST
export async function generateSynthesis(fileId: string, onUpdate: (text: string, stage?: string) => void) {
  // 1. Pro Move: Check for Synthesis OR Full Text cache
  onUpdate('', 'Checking neural cache...');
  const { data: cached, error: dbError } = await supabase
    .from('courses')
    .select('synthesis, full_text')
    .or(`id.eq.${fileId},file_id.eq.${fileId}`)
    .single();

  // If the query failed because full_text column is missing, try just synthesis
  if (dbError && dbError.message.includes('full_text')) {
    console.warn('Supabase: full_text column missing. Please run the SQL migration.');
    const { data: fallback } = await supabase
      .from('courses')
      .select('synthesis')
      .or(`id.eq.${fileId},file_id.eq.${fileId}`)
      .single();
    if (fallback?.synthesis) {
      onUpdate(fallback.synthesis, 'Ready');
      return fallback.synthesis;
    }
  }

  // If synthesis exists, return it immediately
  if (cached?.synthesis) {
    onUpdate(cached.synthesis, 'Ready');
    return cached.synthesis;
  }

  // 2. If ONLY Full Text exists, use GROQ for an INSTANT summary
  if (cached?.full_text && GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    onUpdate('', 'Instant Groq Synthesis...');
    try {
      const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are the USTED Scholar AI. Create a deep academic synthesis in Markdown from the provided text.' },
          { role: 'user', content: cached.full_text }
        ],
        model: 'llama-3.3-70b-versatile',
        stream: true,
      });

      let text = '';
      for await (const chunk of completion) {
        text += chunk.choices[0]?.delta?.content || '';
        onUpdate(text, 'Writing...');
      }

      // Cache the newly generated synthesis
      await supabase
        .from('courses')
        .update({ synthesis: text })
        .or(`id.eq.${fileId},file_id.eq.${fileId}`);

      return text;
    } catch (e) {
      console.warn('Groq synthesis failed, falling back to Gemini');
    }
  }

  // 3. Fallback: Gemini "Reads" the PDF and we cache the FULL TEXT for next time
  const models = ['gemini-2.5-flash-lite', 'gemini-1.5-flash'];
  
  for (let k = 0; k < API_KEYS.length; k++) {
    const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
    
    try {
      onUpdate('', 'Accessing Google Drive...');
      const base64 = await fetchPdfBase64(fileId);
      if (!base64) throw new Error('Could not read document from Drive. Check link permissions.');

      onUpdate('', 'AI Extracting Deep Content...');
      const model = genAI.getGenerativeModel({ 
        model: models[0],
        systemInstruction: 'You are the USTED Scholar AI. 1. Extract the full text of this PDF exactly. 2. Then provide a synthesis. Use a separator "---TEXT_END---".'
      });

      const result = await model.generateContentStream([
        { inlineData: { data: base64, mimeType: 'application/pdf' } },
        { text: 'Extract all text and synthesize.' }
      ]);

      let fullResponse = '';
      onUpdate('', 'Streaming Knowledge...');
      for await (const chunk of result.stream) {
        fullResponse += chunk.text();
        // Only show the part after the separator to the user (the synthesis)
        const parts = fullResponse.split('---TEXT_END---');
        const display = parts[parts.length - 1].trim();
        onUpdate(display, 'Writing...');
      }

      const parts = fullResponse.split('---TEXT_END---');
      const extractedText = parts[0].trim();
      const synthesisText = parts[parts.length - 1].trim();

      // 4. THE MAGIC: Save BOTH for future instant access
      await supabase
        .from('courses')
        .update({ 
          synthesis: synthesisText,
          full_text: extractedText 
        })
        .or(`id.eq.${fileId},file_id.eq.${fileId}`);

      return synthesisText;
    } catch (error: any) {
      console.warn(`Key ${currentKeyIndex + 1} failed. Rotating...`, error.message);
      
      if (error.message?.includes('429')) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        onUpdate('', `Rotating Neural Link (Key ${currentKeyIndex + 1})...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error('All neural paths busy. Switch to a pre-cached document or wait 30s.');
}

// Service: Chat with Document
export async function streamChat(fileId: string, message: string, history: any[], onUpdate: (text: string) => void, context?: string) {
  // 1. Try Groq for Speed (Llama 3.3)
  if (GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    try {
      const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });
      
      // Use provided context or fetch from DB
      let systemContext = context;
      if (!systemContext) {
        // Try to get both, but fall back to just synthesis if column is missing
        const { data: cached, error: dbError } = await supabase
          .from('courses')
          .select('synthesis, full_text')
          .or(`id.eq.${fileId},file_id.eq.${fileId}`)
          .maybeSingle();

        if (dbError && dbError.message.includes('full_text')) {
           const { data: fallback } = await supabase
            .from('courses')
            .select('synthesis')
            .or(`id.eq.${fileId},file_id.eq.${fileId}`)
            .maybeSingle();
           systemContext = fallback?.synthesis || '';
        } else {
           systemContext = cached?.full_text || cached?.synthesis || '';
        }
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: `You are USTED Scholar AI. Use this context: ${systemContext}` },
          ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
        stream: true,
      });

      let accumulated = '';
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        accumulated += content;
        onUpdate(accumulated);
      }
      return;
    } catch (e) {
      console.warn('Groq failed, falling back to Gemini', e);
    }
  }

  // 2. Fallback to Gemini
  const models = ['gemini-2.5-flash-lite', 'gemini-1.5-flash'];
  for (let k = 0; k < API_KEYS.length; k++) {
    const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
    try {
      const base64 = await fetchPdfBase64(fileId);
      const model = genAI.getGenerativeModel({ 
        model: models[0],
        systemInstruction: 'You are the USTED Scholar AI. Answer based on the PDF.'
      });

      const contents = history.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const currentParts: any[] = [];
      if (base64) {
        currentParts.push({ inlineData: { data: base64, mimeType: 'application/pdf' } });
      }
      currentParts.push({ text: message });
      contents.push({ role: 'user', parts: currentParts });

      const result = await model.generateContentStream({ contents });
      let text = '';
      for await (const chunk of result.stream) {
        text += chunk.text();
        onUpdate(text);
      }
      return;
    } catch (error: any) {
      if (error.message?.includes('429')) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        continue;
      }
      throw error;
    }
  }
}

// Service: Generate Quiz
export async function generateQuiz(fileId: string) {
  // 1. Try Cerebras for Throughput
  if (CEREBRAS_API_KEY && CEREBRAS_API_KEY !== 'your_cerebras_api_key_here') {
    try {
      const client = new Cerebras({ apiKey: CEREBRAS_API_KEY });
      
      const { data: cached } = await supabase
        .from('courses')
        .select('synthesis')
        .or(`id.eq.${fileId},file_id.eq.${fileId}`)
        .single();

      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an examiner. Generate 5 MCQs based on the provided context. Return valid JSON with a "questions" array. Each question must have "question", "options" (array of 4 strings), "correctAnswer" (index 0-3), and "explanation".' },
          { role: 'user', content: `Context: ${cached?.synthesis || ''}\n\nGenerate quiz now.` }
        ],
        model: 'llama3.1-70b', // Popular model on Cerebras
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (content) return JSON.parse(content);
    } catch (e) {
      console.warn('Cerebras failed, falling back to Gemini', e);
    }
  }

  // 2. Fallback to Gemini
  const models = ['gemini-2.5-flash-lite', 'gemini-1.5-flash'];
  for (let k = 0; k < API_KEYS.length; k++) {
    const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
    try {
      const base64 = await fetchPdfBase64(fileId);
      const model = genAI.getGenerativeModel({ 
        model: models[0],
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction: 'You are an examiner. Generate 5 MCQs based on the PDF. Return JSON with "questions" array. Each question must have "question", "options" (array of 4 strings), "correctAnswer" (index 0-3), and "explanation".'
      });

      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType: 'application/pdf' } },
        { text: 'Generate quiz.' }
      ]);

      return JSON.parse(result.response.text());
    } catch (error: any) {
      if (error.message?.includes('429')) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        continue;
      }
      throw error;
    }
  }
}
