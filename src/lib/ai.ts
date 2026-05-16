import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js Worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const GATEWAY_URL = 'https://wruymvxttqlxgcvwfcop.supabase.co/functions/v1/ai-gateway';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Anti-AI Persona & Constraints
const SYNTHESIS_PERSONA = `Act as a Senior Academic Mentor. Use a concise, high-signal, low-noise writing style.
CRITICAL CONSTRAINTS:
1. Strictly Avoid words like: delve, pivotal, comprehensive, transformative, multi-faceted, or underscores.
2. Zero-Intro: DO NOT include introductory phrases or meta-talk like 'Here is a synthesis...', 'According to the document...', or 'Structure by units...'. Start directly with the first heading (e.g. '# Network Fundamentals'). No fluff, no apologies, no summaries of the synthesis process.
3. Formatting: Use bolding for key terms only. Use short bullet points.
4. Tone: Direct, technical, and slightly informal—like a senior student explaining a concept to a junior over coffee.
5. Language: Use standard English, but feel free to use Ghanaian academic context where relevant (e.g., mentioning 'Mid-sem' or 'End-of-sem').`;

const CHAT_PERSONA = `Act as a Senior Academic Mentor named USTED Scholar AI. Use a concise, high-signal, low-noise writing style.
CRITICAL CONSTRAINTS:
1. Tone: Direct, technical, and friendly—like a senior student explaining a concept to a junior over coffee.
2. Language: Use standard English, but feel free to use Ghanaian academic context where relevant (e.g., mentioning 'Mid-sem' or 'End-of-sem').
3. You are a conversational assistant. Reply directly to the user's chat messages. If they greet you, greet them back naturally. Do NOT output a full academic synthesis unless explicitly asked to summarize.
4. Avoid generic AI fluff, apologies, or robotic phrasing. Keep answers highly relevant to the context.`;

function cleanAIText(text: string) {
  const patterns = [
    /^Here is a synthesis.*?\n/i,
    /^Based on the document.*?\n/i,
    /^This document appears to be.*?\n/i,
    /^Here is the.*?\n/i,
    /^Sure,.*?\n/i,
    /^Certainly,.*?\n/i,
    /^Okay,.*?\n/i
  ];
  let cleaned = text.trimStart();
  patterns.forEach(p => cleaned = cleaned.replace(p, '').trimStart());
  return cleaned;
}

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer.slice(0) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
      if (fullText.length > 150000) break;
    }
    return fullText.trim();
  } catch (e) {
    return '';
  }
}

async function fetchPdfBufferFromStorage(fileId: string): Promise<ArrayBuffer | null> {
  try {
    let query = supabase.from('courses').select('storage_path');
    if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
    else query = query.eq('file_id', fileId);
    const { data: course } = await query.maybeSingle();
    if (!course?.storage_path) return null;
    const { data } = await supabase.storage.from('course-materials').download(course.storage_path);
    return data ? await data.arrayBuffer() : null;
  } catch (e) {
    return null;
  }
}

// Service: Generate Synthesis
export async function generateSynthesis(fileId: string, onUpdate: (text: string, stage?: string) => void) {
  onUpdate('', 'Checking neural cache...');
  let query = supabase.from('courses').select('synthesis, full_text');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.maybeSingle();

  if (cached?.synthesis) {
    const cleanedCache = cleanAIText(cached.synthesis);
    onUpdate(cleanedCache, 'Ready');
    return cleanedCache;
  }

  let textToProcess = cached?.full_text || '';
  if (!textToProcess) {
    onUpdate('', 'Extracting text...');
    const buffer = await fetchPdfBufferFromStorage(fileId);
    if (buffer) {
      textToProcess = await extractTextFromPdf(buffer);
      if (textToProcess) {
        await supabase.from('courses').update({ full_text: textToProcess }).eq('id', fileId);
      }
    }
  }

  onUpdate('', 'Secure AI Synthesis...');
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        provider: 'cerebras',
        payload: {
          messages: [
            { role: 'system', content: `You are the USTED Scholar AI. ${SYNTHESIS_PERSONA}` },
            { role: 'user', content: textToProcess }
          ],
          model: 'llama3.1-8b',
          stream: true
        }
      })
    });

    const reader = response.body?.getReader();
    let text = '';
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            text += data.choices[0]?.delta?.content || '';
            onUpdate(cleanAIText(text), 'Writing...');
          } catch (e) {}
        }
      }
    }
    const final = cleanAIText(text);
    await supabase.from('courses').update({ synthesis: final }).eq('id', fileId);
    return final;
  } catch (e) {
    console.error('Synthesis failed:', e);
  }
}

// Service: Chat with Document
export async function streamChat(fileId: string, message: string, history: any[], onUpdate: (text: string) => void, synthesisContext?: string, imageFile?: File | null) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.maybeSingle();
  const systemContext = cached?.full_text || cached?.synthesis || '';

  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        provider: 'groq',
        payload: {
          messages: [
            { role: 'system', content: `You are USTED Scholar AI. Use this context: ${systemContext}\n\n${CHAT_PERSONA}` },
            ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: message }
          ],
          model: 'llama-3.3-70b-versatile',
          stream: true
        }
      })
    });

    const reader = response.body?.getReader();
    let text = '';
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            text += data.choices[0]?.delta?.content || '';
            onUpdate(cleanAIText(text));
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.error('Chat failed:', e);
  }
}

// Service: Generate Quiz
export async function generateQuiz(fileId: string) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.single();
  const context = cached?.full_text || cached?.synthesis || '';

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      provider: 'gemini',
      payload: {
        model: 'gemini-2.5-flash-lite',
        contents: [{ parts: [{ text: `Context: ${context}\n\nGenerate 5 academic MCQs in JSON. Return a "questions" array where each object has: "question", "options" (4 strings), "correctAnswer" (index), and "explanation".` }] }],
        generationConfig: { responseMimeType: "application/json" }
      }
    })
  });
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

// Service: Generate Flashcards
export async function generateFlashcards(fileId: string) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.single();
  const context = cached?.full_text || cached?.synthesis || '';

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      provider: 'gemini',
      payload: {
        model: 'gemini-2.5-flash-lite',
        contents: [{ parts: [{ text: `Context: ${context}\n\nGenerate 15 academic flashcards in JSON. Return a "cards" array with "front" and "back".` }] }],
        generationConfig: { responseMimeType: "application/json" }
      }
    })
  });
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

// Service: Generate Smart Chat Title
export async function generateThreadTitle(userMessage: string) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        provider: 'cerebras',
        payload: {
          messages: [{ role: 'system', content: 'Generate a short punchy 3-5 word title for this message. No quotes.' }, { role: 'user', content: userMessage }],
          model: 'llama3.1-8b'
        }
      })
    });
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/['"]/g, '');
  } catch (e) {
    return userMessage.slice(0, 20);
  }
}
