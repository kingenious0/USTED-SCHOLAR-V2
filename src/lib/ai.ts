import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { extractTextFromPdf } from './pdfUtils';
import * as pdfjs from 'pdfjs-dist';

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

async function fetchPdfBufferFromStorage(fileId: string): Promise<ArrayBuffer | null> {
  try {
    let query = supabase.from('courses').select('storage_path');
    
    if (isUUID(fileId)) {
      query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
    } else {
      // If not a UUID, it's definitely a file_id string
      query = query.eq('file_id', fileId);
    }
    
    // Always get the latest upload
    const { data: courses } = await query.order('created_at', { ascending: false });
    const course = courses?.[0];
    
    if (!course?.storage_path) return null;
    const { data } = await supabase.storage.from('course-materials').download(course.storage_path);
    return data ? await data.arrayBuffer() : null;
  } catch (e) {
    return null;
  }
}

// Service: Generate Synthesis
export async function generateSynthesis(fileId: string, onUpdate: (text: string, stage?: string) => void, force: boolean = false) {
  onUpdate('', 'Checking neural cache...');
  
  if (!force) {
    let query = supabase.from('courses').select('synthesis, full_text, storage_path, file_id');
    if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
    else query = query.eq('file_id', fileId);
    const { data: cached } = await query.maybeSingle();

    if (cached?.synthesis) {
      const cleanedCache = cleanAIText(cached.synthesis);
      onUpdate(cleanedCache, 'Ready');
      return cleanedCache;
    }
    
    // If not forced, try to use full_text if available
    let textToProcess = cached?.full_text || '';
    
    // Dynamically resolve legacy document OCR via backend Unstructured.io if full_text is empty
    if (!textToProcess && cached?.storage_path && cached?.file_id) {
      onUpdate('', 'Analyzing document DNA (Heavy-Duty OCR)... 👁️');
      try {
        const { data: parseData, error: parseError } = await supabase.functions.invoke('admin-manager', {
          body: { 
            action: 'parseDocument', 
            fileId: cached.file_id, 
            storagePath: cached.storage_path 
          }
        });
        if (!parseError && parseData?.success) {
          let refetchQuery = supabase.from('courses').select('full_text');
          if (isUUID(fileId)) refetchQuery = refetchQuery.or(`id.eq.${fileId},file_id.eq.${fileId}`);
          else refetchQuery = refetchQuery.eq('file_id', fileId);
          const { data: refetched } = await refetchQuery.maybeSingle();
          textToProcess = refetched?.full_text || '';
          console.log(`✅ Dynamically resolved legacy document OCR with ${textToProcess?.length} characters!`);
        }
      } catch (err) {
        console.warn("Dynamic OCR resolution failed, falling back to local extractor:", err);
      }
    }

    if (textToProcess) {
      const MAX_CHAR_LIMIT = 400000; // Expanded to 400k to fully utilize Cerebras Llama 3.1 131k context window (128k tokens)
      let optimizedText = textToProcess;
      if (textToProcess.length > MAX_CHAR_LIMIT) {
        console.warn(`✂️ Optimizing text payload from ${textToProcess.length} to ${MAX_CHAR_LIMIT} chars for Cerebras context limits.`);
        optimizedText = textToProcess.substring(0, MAX_CHAR_LIMIT) + 
          "\n\n... [Content truncated for AI token window optimization. Ask the AI assistant on the right to explain specific sections in deeper detail!] ...";
      }
      return await performSynthesis(fileId, optimizedText, onUpdate);
    }
  }

  // Force extraction or no cache found
  onUpdate('', 'Extracting text...');
  const buffer = await fetchPdfBufferFromStorage(fileId);
  if (!buffer) {
    onUpdate('### Error: Could not reach document storage.', 'Error');
    return;
  }

  let textToProcess = await extractTextFromPdf(buffer, (page, total) => {
    onUpdate('', `Reading Page ${page}/${total}... 👁️`);
  });
  
  if (!textToProcess) {
    // Dynamically query database record info to execute backend OCR trigger
    let query = supabase.from('courses').select('storage_path, file_id');
    if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
    else query = query.eq('file_id', fileId);
    const { data: courseInfo } = await query.maybeSingle();

    if (courseInfo?.storage_path && courseInfo?.file_id) {
      onUpdate('', 'Visualizing document (Heavy-Duty Backend OCR)... 👁️');
      try {
        const { data: parseData, error: parseError } = await supabase.functions.invoke('admin-manager', {
          body: { 
            action: 'parseDocument', 
            fileId: courseInfo.file_id, 
            storagePath: courseInfo.storage_path 
          }
        });
        if (!parseError && parseData?.success) {
          const { data: refetched } = await supabase.from('courses').select('full_text').eq('file_id', courseInfo.file_id).maybeSingle();
          textToProcess = refetched?.full_text || '';
          console.log(`✅ Dynamically resolved legacy document OCR during forced extraction with ${textToProcess?.length} characters!`);
        }
      } catch (err) {
        console.warn("Forced dynamic OCR failed, using empty fallback:", err);
      }
    }
  }

  if (!textToProcess) {
    onUpdate('### Error: PDF extraction failed.\n\nThe document appears to be empty or non-readable even with heavy-duty visual OCR.', 'Error');
    return;
  }

  // Save the extracted text for future use
  let saveQuery = supabase.from('courses').update({ full_text: textToProcess });
  if (isUUID(fileId)) saveQuery = saveQuery.eq('id', fileId);
  else saveQuery = saveQuery.eq('file_id', fileId);
  await saveQuery;
  
  // Truncate text payload if it exceeds Cerebras context bounds
  const MAX_CHAR_LIMIT = 400000; // Expanded to 400k to fully utilize Cerebras Llama 3.1 131k context window (128k tokens)
  let optimizedText = textToProcess;
  if (textToProcess.length > MAX_CHAR_LIMIT) {
    console.warn(`✂️ Optimizing text payload from ${textToProcess.length} to ${MAX_CHAR_LIMIT} chars for Cerebras context limits.`);
    optimizedText = textToProcess.substring(0, MAX_CHAR_LIMIT) + 
      "\n\n... [Content truncated for AI token window optimization. Ask the AI assistant on the right to explain specific sections in deeper detail!] ...";
  }

  return await performSynthesis(fileId, optimizedText, onUpdate);
}

async function performSynthesis(fileId: string, textToProcess: string, onUpdate: (text: string, stage?: string) => void) {
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

    if (!response.ok) {
      const errText = await response.text();
      let parsedError = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedError = parsed.message || parsed.error || errText;
      } catch (pe) {}
      throw new Error(`AI Gateway Error (${response.status}): ${parsedError}`);
    }

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
    
    // Safety Update: Target the right column based on ID type
    let updateQuery = supabase.from('courses').update({ synthesis: final });
    if (isUUID(fileId)) updateQuery = updateQuery.eq('id', fileId);
    else updateQuery = updateQuery.eq('file_id', fileId);
    
    await updateQuery;
    return final;
  } catch (e) {
    console.error('Synthesis failed:', e);
    throw e; // Re-throw error so generateSynthesis caller receives it
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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Gateway Error (${response.status}): ${errText}`);
    }

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
    throw e;
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
  if (!response.ok) {
    throw new Error(`Quiz Generation failed with status ${response.status}`);
  }
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
  if (!response.ok) {
    throw new Error(`Flashcard Generation failed with status ${response.status}`);
  }
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
