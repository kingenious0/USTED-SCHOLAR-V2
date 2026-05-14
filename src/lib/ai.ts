import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js Worker (Vite-compatible local worker)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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

// Helper: UUID Validation
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper: Extract Text from PDF (SILENT EXTRACTION)
async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use a slice to avoid detaching the main buffer
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer.slice(0) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    console.log(`📄 PDF Extraction: Starting for ${pdf.numPages} pages...`);
    for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
      if (fullText.length > 150000) break;
    }
    
    const trimmed = fullText.trim();
    console.log(`📄 PDF Extraction: Found ${trimmed.length} characters.`);
    return trimmed;
  } catch (e) {
    console.error('PDF Extraction Error:', e);
    return '';
  }
}

// Helper: Fetch PDF from Supabase Storage
async function fetchPdfBufferFromStorage(fileId: string): Promise<ArrayBuffer | null> {
  try {
    console.log('🔍 Diagnostic: Fetching path for ID:', fileId);
    let query = supabase.from('courses').select('storage_path, name');
    if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
    else query = query.eq('file_id', fileId);

    const { data: course, error: dbError } = await query.maybeSingle();
    if (dbError || !course?.storage_path) {
      console.error('❌ DB Error or Missing Path:', dbError, course);
      return null;
    }

    const rawPath = course.storage_path;
    console.log('📡 Attempting Download:', rawPath);
    
    const { data, error: storageError } = await supabase.storage
      .from('course-materials')
      .download(rawPath);

    if (storageError && (storageError as any).status === 400) {
      console.log('🔍 Deep Hunter: Searching for misplaced file...');
      const fileName = rawPath.split('/').pop() || '';
      
      // Try listing root folders to see what exists
      const { data: rootItems } = await supabase.storage.from('course-materials').list('');
      console.log('📂 Folders found in Storage:', rootItems?.map(f => `"${f.name}"`).join(', '));

      if (rootItems) {
        for (const folder of rootItems) {
          const { data: folderFiles } = await supabase.storage
            .from('course-materials')
            .list(folder.name);

          const match = folderFiles?.find(f => 
            f.name.toLowerCase().trim() === fileName.toLowerCase().trim()
          );

          if (match) {
            const correctedPath = `${folder.name}/${match.name}`;
            console.log('✅ Deep Hunter: Found match in folder:', correctedPath);
            const { data: retryData } = await supabase.storage
              .from('course-materials')
              .download(correctedPath);
            if (retryData) return await retryData.arrayBuffer();
          }
        }
      }
    }

    if (storageError) {
      console.error('❌ Supabase Storage Error:', storageError.message);
      return null;
    }

    if (!data) return null;
    return await data.arrayBuffer();
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
  let mainBuffer: ArrayBuffer | null = null;

  if (!textToProcess) {
    onUpdate('', 'Silently extracting text...');
    mainBuffer = await fetchPdfBufferFromStorage(fileId);
    if (mainBuffer) {
      textToProcess = await extractTextFromPdf(mainBuffer);
      if (textToProcess) {
        let updateQuery = supabase.from('courses').update({ full_text: textToProcess });
        if (isUUID(fileId)) updateQuery = updateQuery.or(`id.eq.${fileId},file_id.eq.${fileId}`);
        else updateQuery = updateQuery.eq('file_id', fileId);
        await updateQuery;
      }
    }
  }

  // --- TRACK 1: CEREBRAS (TEXT) ---
  if (textToProcess && CEREBRAS_API_KEY && CEREBRAS_API_KEY !== 'your_cerebras_api_key_here') {
    onUpdate('', 'Cerebras 70B Synthesis...');
    try {
      const client = new Cerebras({ apiKey: CEREBRAS_API_KEY, dangerouslyAllowBrowser: true });
      const completion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: `You are the USTED Scholar AI. ${SYNTHESIS_PERSONA}` },
          { role: 'user', content: textToProcess }

        ],
        model: 'llama3.1-8b', // SWAPPED to user-available 8B model
        stream: true,
      });

      let text = '';
      for await (const chunk of completion) {
        text += chunk.choices[0]?.delta?.content || '';
        onUpdate(cleanAIText(text), 'Writing...');
      }

      const finalCleaned = cleanAIText(text);
      let updateQuery = supabase.from('courses').update({ synthesis: finalCleaned });
      if (isUUID(fileId)) updateQuery = updateQuery.or(`id.eq.${fileId},file_id.eq.${fileId}`);
      else updateQuery = updateQuery.eq('file_id', fileId);
      await updateQuery;
      return finalCleaned;
    } catch (e) {
      console.warn('Cerebras failed, falling back...');
    }
  }

  // --- TRACK 2: GEMINI (OCR / FALLBACK) ---
  onUpdate('', 'Gemini Neural Vision (OCR)...');
  for (let k = 0; k < API_KEYS.length; k++) {
    const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        systemInstruction: `You are the USTED Scholar AI. ${SYNTHESIS_PERSONA}`
      });
      let prompt: any[] = [];

      if (textToProcess) {
        prompt.push({ text: `Context: ${textToProcess}\n\nSynthesize this academic document.` });
      } else {
        if (!mainBuffer) mainBuffer = await fetchPdfBufferFromStorage(fileId);
        if (!mainBuffer) throw new Error('File download failed.');
        
        // Pass a copy to avoid detachment
        const base64 = btoa(new Uint8Array(mainBuffer.slice(0)).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        prompt.push({ inlineData: { data: base64, mimeType: 'application/pdf' } });
        prompt.push({ text: 'Synthesize this document (OCR mode).' });
      }

      const result = await model.generateContentStream(prompt);
      let text = '';
      for await (const chunk of result.stream) {
        text += chunk.text();
        onUpdate(cleanAIText(text), 'Writing...');
      }

      const finalCleaned = cleanAIText(text);
      let updateQuery = supabase.from('courses').update({ synthesis: finalCleaned });
      if (isUUID(fileId)) updateQuery = updateQuery.or(`id.eq.${fileId},file_id.eq.${fileId}`);
      else updateQuery = updateQuery.eq('file_id', fileId);
      await updateQuery;
      return finalCleaned;
    } catch (error: any) {
      if (error.message?.includes('429')) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        continue;
      }
      throw error;
    }
  }
}

// Service: Chat with Document
export async function streamChat(fileId: string, message: string, history: any[], onUpdate: (text: string) => void, synthesisContext?: string, imageFile?: File | null) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.maybeSingle();
  const systemContext = cached?.full_text || cached?.synthesis || '';

  // Skip Groq/Cerebras if there's an image attached, because we need Gemini Vision
  if (!imageFile && GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    try {
      const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: `You are USTED Scholar AI. Use this context: ${systemContext}\n\n${CHAT_PERSONA}` },
          ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
        stream: true,
      });
      let accumulated = '';
      for await (const chunk of chatCompletion) {
        accumulated += chunk.choices[0]?.delta?.content || '';
        onUpdate(cleanAIText(accumulated));
      }
      return;
    } catch (e) {}
  }

  const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
    systemInstruction: `You are USTED Scholar AI. Use this context: ${systemContext}\n\n${CHAT_PERSONA}`
  });
  const contents: any[] = history.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] }));
  
  const currentParts: any[] = [{ text: message }];
  
  if (imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    currentParts.push({ inlineData: { data: base64, mimeType: imageFile.type } });
  }

  contents.push({ role: 'user', parts: currentParts });
  const result = await model.generateContentStream({ contents });
  let text = '';
  for await (const chunk of result.stream) {
    text += chunk.text();
    onUpdate(cleanAIText(text));
  }
}

// Service: Generate Quiz
export async function generateQuiz(fileId: string) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.single();
  const context = cached?.full_text || cached?.synthesis || '';

  if (CEREBRAS_API_KEY && CEREBRAS_API_KEY !== 'your_cerebras_api_key_here') {
    try {
      const client = new Cerebras({ apiKey: CEREBRAS_API_KEY, dangerouslyAllowBrowser: true });
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: 'Generate 5 academic MCQs in JSON. Return a "questions" array where each object has: "question" (string), "options" (array of 4 strings), "correctAnswer" (index 0-3), and "explanation" (string).' },
          { role: 'user', content: `Context: ${context}` }
        ],
        model: 'llama3.1-8b', 
        response_format: { type: 'json_object' }
      });
      const content = response.choices[0].message.content;
      if (content) return JSON.parse(content);
    } catch (e) {}
  }

  const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite', generationConfig: { responseMimeType: "application/json" } });
  const result = await model.generateContent([{ text: `Context: ${context}\n\nGenerate quiz JSON with "questions" array. Each question must have "question", "options" (4 strings), "correctAnswer" (index), and "explanation".` }]);
  return JSON.parse(result.response.text());
}

// Service: Generate Flashcards
export async function generateFlashcards(fileId: string) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.single();
  const context = cached?.full_text || cached?.synthesis || '';

  const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite', 
    generationConfig: { responseMimeType: "application/json" } 
  });

  const prompt = `Context: ${context}\n\nGenerate 15 academic flashcards in JSON. 
  Return a "cards" array where each object has:
  "front": (A concise question or core concept name),
  "back": (A clear, informative explanation or definition).
  Focus on the most examinable points.`;

  try {
    const result = await model.generateContent([{ text: prompt }]);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Flashcard Generation Error:', error);
    throw error;
  }
}

// Service: Generate Smart Chat Title
export async function generateThreadTitle(userMessage: string) {
  try {
    // Try Cerebras first if available because it's insanely fast
    if (CEREBRAS_API_KEY && CEREBRAS_API_KEY !== 'your_cerebras_api_key_here') {
      const client = new Cerebras({ apiKey: CEREBRAS_API_KEY, dangerouslyAllowBrowser: true });
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a title generator. Generate a short, punchy 3-5 word title for the user\'s message. Do not use quotes, punctuation, or formatting.' },
          { role: 'user', content: userMessage }
        ],
        model: 'llama3.1-8b', 
      });
      const content = response.choices[0].message.content;
      if (content) return content.trim().replace(/['"]/g, '');
    }

    // Fallback to Gemini
    const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `Generate a very short, punchy 3-5 word title for a chat session that starts with this message:\n\n"${userMessage}"\n\nDo not use quotes or punctuation. Just output the title.`;
    const result = await model.generateContent([{ text: prompt }]);
    return result.response.text().trim().replace(/['"]/g, '');
  } catch (error) {
    console.error('Title Gen Error:', error);
    // Silent fallback to standard truncation
    return userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
  }
}
