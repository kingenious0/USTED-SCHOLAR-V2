import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { extractTextFromPdf } from './pdfUtils';

const GATEWAY_URL = 'https://wruymvxttqlxgcvwfcop.supabase.co/functions/v1/ai-gateway';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

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
  console.log("🧬 generateSynthesis: ENTERED for fileId:", fileId, "force:", force);
  onUpdate('', 'Checking neural cache...');
  
  if (!force) {
    let query = supabase.from('courses').select('synthesis, full_text, storage_path, file_id');
    if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
    else query = query.eq('file_id', fileId);
    
    console.log("🧬 generateSynthesis: Querying Supabase courses table for cache...");
    const { data: list, error: queryError } = await query.order('created_at', { ascending: false });

    if (queryError) {
      console.error("🧬 generateSynthesis: Supabase query error:", queryError.message);
      throw queryError;
    }

    const cached = list?.[0];
    console.log("🧬 generateSynthesis: Supabase query result (latest cached course):", cached);

    if (cached?.synthesis) {
      console.log("🧬 generateSynthesis: FOUND CACHED SYNTHESIS! Clean cache and update.");
      const cleanedCache = cleanAIText(cached.synthesis);
      onUpdate(cleanedCache, 'Ready');
      return cleanedCache;
    }
    
    // If not forced, try to use full_text if available
    let textToProcess = cached?.full_text || '';
    console.log("🧬 generateSynthesis: No cached synthesis found. Text to process length:", textToProcess.length);
    
    // Dynamically resolve legacy document OCR via backend Unstructured.io if full_text is empty
    if (!textToProcess && cached?.storage_path && cached?.file_id) {
      console.log("🧬 generateSynthesis: Text is empty, triggering dynamic backend OCR fallback...");
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
        } else {
          console.warn("🧬 generateSynthesis: Backend OCR invocation finished with error:", parseError || parseData?.error);
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
      console.log("🧬 generateSynthesis: Text found! Dispatched to performSynthesis...");
      return await performSynthesis(fileId, optimizedText, onUpdate);
    } else {
      console.log("🧬 generateSynthesis: No text found in cache. Proceeding to force extraction/download...");
    }
  }

  // Force extraction or no cache found
  console.log("🧬 generateSynthesis: Initiating forced/manual extraction from Storage...");
  onUpdate('', 'Extracting text...');
  const buffer = await fetchPdfBufferFromStorage(fileId);
  if (!buffer) {
    console.error("🧬 generateSynthesis: fetchPdfBufferFromStorage returned null. Could not read storage.");
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
  console.log("🧬 performSynthesis: ENTERED for fileId:", fileId, "text length:", textToProcess.length);
  onUpdate('', 'Secure AI Synthesis...');

  const attempts = [
    { provider: 'cerebras', model: 'llama-3.3-70b' },
    { provider: 'cerebras', model: 'llama3.1-70b' },
    { provider: 'cerebras', model: 'llama3.1-8b' },
    { provider: 'gemini', model: 'gemini-2.5-flash-lite' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'groq', model: 'llama-3.3-70b-versatile' }
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      console.log(`🧬 performSynthesis: Attempting synthesis via ${attempt.provider} (Model: ${attempt.model})...`);
      const headers = await authHeaders();
      console.log("🧬 performSynthesis: Authorization headers retrieved. Token length:", headers['Authorization']?.length);

      // Structure payload dynamically based on provider API requirements (OpenAI vs Google Gemini)
      let bodyPayload: any = {};
      if (attempt.provider === 'gemini') {
        bodyPayload = {
          provider: 'gemini',
          payload: {
            model: attempt.model,
            stream: true,
            contents: [
              { role: 'user', parts: [{ text: textToProcess }] }
            ],
            system_instruction: {
              parts: [{ text: `You are the USTED Scholar AI. ${SYNTHESIS_PERSONA}` }]
            }
          }
        };
      } else {
        bodyPayload = {
          provider: attempt.provider,
          payload: {
            messages: [
              { role: 'system', content: `You are the USTED Scholar AI. ${SYNTHESIS_PERSONA}` },
              { role: 'user', content: textToProcess }
            ],
            model: attempt.model,
            stream: true
          }
        };
      }

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      console.log(`🧬 performSynthesis: ${attempt.provider} gateway response status:`, response.status, response.statusText);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${attempt.provider} gateway HTTP error: ${errText}`);
      }

      const reader = response.body?.getReader();
      let text = '';
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        console.log(`🧬 performSynthesis: Chunk received from ${attempt.provider}:`, chunk.slice(0, 150) + (chunk.length > 150 ? '...' : ''));

        // Check for stream-level errors wrapped inside a 200 HTTP code (like Cerebras' model_not_found or Groq's rate limit)
        if (isFirstChunk) {
          isFirstChunk = false;
          if (chunk.includes('model_not_found') || chunk.includes('not_found_error') || chunk.includes('does not exist') || chunk.includes('rate_limit_exceeded') || chunk.includes('Rate limit reached')) {
            throw new Error(`Stream error from ${attempt.provider}: ${chunk}`);
          }
        }

        if (attempt.provider === 'gemini') {
          // Robust JSON regex parsing for Gemini stream chunk candidates
          const matches = chunk.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
          for (const match of matches) {
            try {
              text += JSON.parse(`"${match[1]}"`);
            } catch (e) {}
          }
          onUpdate(cleanAIText(text), 'Writing...');
        } else {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                let content = data.choices?.[0]?.delta?.content || '';
                text += content;
                onUpdate(cleanAIText(text), 'Writing...');
              } catch (e) {}
            }
          }
        }
      }

      const final = cleanAIText(text);
      if (!final || final.trim().length === 0) {
        throw new Error(`Empty synthesis text returned from ${attempt.provider}`);
      }

      console.log(`🧬 performSynthesis: SUCCESS! Synthesis generated successfully using ${attempt.provider}.`);

      // Save the synthesis to the DB
      let updateQuery = supabase.from('courses').update({ synthesis: final });
      if (isUUID(fileId)) updateQuery = updateQuery.eq('id', fileId);
      else updateQuery = updateQuery.eq('file_id', fileId);
      await updateQuery;

      return final;

    } catch (err: any) {
      console.error(`🧬 performSynthesis: ${attempt.provider} attempt FAILED:`, err.message);
      lastError = err;
      // Loop continues to the next provider (Groq)
    }
  }

  // If we reach here, all providers have failed
  throw new Error(`All synthesis providers failed. Last error: ${lastError?.message}`);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Service: Chat with Document (supports images via Gemini)
export async function streamChat(fileId: string, message: string, history: any[], onUpdate: (text: string) => void, synthesisContext?: string, imageFile?: File | null) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.maybeSingle();
  const systemContext = cached?.full_text || cached?.synthesis || '';

  try {
    const hasImage = !!imageFile;

    if (hasImage) {
      const base64 = await fileToBase64(imageFile!);
      const imageMime = imageFile!.type || 'image/png';

      const contents: any[] = history.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text || '' }]
      }));
      contents.push({
        role: 'user',
        parts: [
          { text: message },
          { inline_data: { mime_type: imageMime, data: base64 } }
        ]
      });

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          provider: 'gemini',
          payload: {
            model: 'gemini-2.5-flash-lite',
            stream: true,
            contents,
            system_instruction: {
              parts: [{ text: `You are USTED Scholar AI. Use this context: ${systemContext}\n\n${CHAT_PERSONA}` }]
            }
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Vision Error (${response.status}): ${errText}`);
      }

      const reader = response.body?.getReader();
      let text = '';
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        
        // Parse Gemini chunks using both standard SSE and robust regex fallback
        const matches = chunk.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
        let hasMatches = false;
        for (const match of matches) {
          try {
            text += JSON.parse(`"${match[1]}"`);
            hasMatches = true;
          } catch (e) {}
        }
        
        if (hasMatches) {
          onUpdate(cleanAIText(text));
        } else {
          // Standard SSE fallback
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                text += data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                onUpdate(cleanAIText(text));
              } catch (e) {}
            }
          }
        }
      }
    } else {
      const attempts = [
        { provider: 'cerebras', model: 'llama-3.3-70b' },
        { provider: 'cerebras', model: 'llama3.1-70b' },
        { provider: 'cerebras', model: 'llama3.1-8b' },
        { provider: 'gemini', model: 'gemini-2.5-flash-lite' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' }
      ];

      let lastError: any = null;
      for (const attempt of attempts) {
        try {
          console.log(`🧬 streamChat: Attempting chat via ${attempt.provider} (Model: ${attempt.model})...`);
          
          let bodyPayload: any = {};
          if (attempt.provider === 'gemini') {
            bodyPayload = {
              provider: 'gemini',
              payload: {
                model: attempt.model,
                stream: true,
                contents: [
                  ...history.map(m => ({
                    role: m.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: m.text || '' }]
                  })),
                  { role: 'user', parts: [{ text: message }] }
                ],
                system_instruction: {
                  parts: [{ text: `You are USTED Scholar AI. Use this context: ${systemContext}\n\n${CHAT_PERSONA}` }]
                }
              }
            };
          } else {
            bodyPayload = {
              provider: attempt.provider,
              payload: {
                messages: [
                  { role: 'system', content: `You are USTED Scholar AI. Use this context: ${systemContext}\n\n${CHAT_PERSONA}` },
                  ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
                  { role: 'user', content: message }
                ],
                model: attempt.model,
                stream: true
              }
            };
          }

          const response = await fetch(GATEWAY_URL, {
            method: 'POST',
            headers: await authHeaders(),
            body: JSON.stringify(bodyPayload)
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`${attempt.provider} gateway HTTP error: ${errText}`);
          }

          const reader = response.body?.getReader();
          let text = '';
          let isFirstChunk = true;

          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);

            // Stream-level error interceptor
            if (isFirstChunk) {
              isFirstChunk = false;
              if (chunk.includes('model_not_found') || chunk.includes('not_found_error') || chunk.includes('does not exist') || chunk.includes('rate_limit_exceeded') || chunk.includes('Rate limit reached')) {
                throw new Error(`Stream error from ${attempt.provider}: ${chunk}`);
              }
            }

            if (attempt.provider === 'gemini') {
              const matches = chunk.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
              for (const match of matches) {
                try {
                  text += JSON.parse(`"${match[1]}"`);
                } catch (e) {}
              }
              onUpdate(cleanAIText(text));
            } else {
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    text += data.choices?.[0]?.delta?.content || '';
                    onUpdate(cleanAIText(text));
                  } catch (e) {}
                }
              }
            }
          }

          if (text.trim().length > 0) {
            return;
          }
          throw new Error(`Empty stream response returned from ${attempt.provider}`);

        } catch (err: any) {
          console.warn(`🧬 streamChat: ${attempt.provider} attempt FAILED:`, err.message);
          lastError = err;
        }
      }

      throw new Error(`All chat providers failed. Last error: ${lastError?.message}`);
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
  const { data: cached } = await query.maybeSingle();
  const context = cached?.full_text || cached?.synthesis || '';

  if (!context) {
    throw new Error('No course content available to generate a quiz. The document may not have been processed yet.');
  }

  const attempts = [
    { provider: 'cerebras', model: 'llama-3.3-70b' },
    { provider: 'cerebras', model: 'llama3.1-70b' },
    { provider: 'cerebras', model: 'llama3.1-8b' },
    { provider: 'gemini', model: 'gemini-2.5-flash-lite' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'groq', model: 'llama-3.3-70b-versatile' }
  ];

  let lastError: any = null;
  for (const attempt of attempts) {
    try {
      console.log(`🧠 generateQuiz: Attempting via ${attempt.provider} (${attempt.model})...`);
      let bodyPayload: any = {};
      
      if (attempt.provider === 'gemini') {
        bodyPayload = {
          provider: 'gemini',
          payload: {
            model: attempt.model,
            contents: [{ parts: [{ text: `Context: ${context}\n\nGenerate 5 academic MCQs in JSON. Return a "questions" array where each object has: "question", "options" (4 strings), "correctAnswer" (index), and "explanation".` }] }],
            generationConfig: { responseMimeType: "application/json" }
          }
        };
      } else {
        bodyPayload = {
          provider: attempt.provider,
          payload: {
            messages: [
              { 
                role: 'system', 
                content: 'You are an academic examiner. Your job is to read the course context and generate a JSON object with a "questions" array. Each question MUST contain: "question" (string), "options" (array of 4 strings), "correctAnswer" (integer index 0-3), and "explanation" (string explaining why it is correct). Return ONLY the raw JSON block without markdown formatting or code blocks.' 
              },
              { 
                role: 'user', 
                content: `Context: ${context}` 
              }
            ],
            model: attempt.model,
            stream: false
          }
        };
      }

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        throw new Error(`Gateway returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      let text = '';
      if (attempt.provider === 'gemini') {
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('Gemini returned no candidates');
        }
        text = data.candidates[0].content.parts[0].text;
      } else {
        text = data.choices?.[0]?.message?.content || '';
      }

      // Try parsing and validating
      text = text.trim();
      // Strip markdown code block if present
      if (text.startsWith('```json')) {
        text = text.substring(7);
      } else if (text.startsWith('```')) {
        text = text.substring(3);
      }
      if (text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      text = text.trim();

      const parsed = JSON.parse(text);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed;
      } else if (Array.isArray(parsed)) {
        return { questions: parsed };
      } else {
        throw new Error('JSON structure did not contain questions array');
      }
    } catch (err) {
      console.warn(`⚠️ generateQuiz: ${attempt.provider} failed:`, err);
      lastError = err;
    }
  }

  throw new Error(`All quiz generation attempts failed. Last error: ${lastError?.message}`);
}

// Service: Generate Flashcards
export async function generateFlashcards(fileId: string) {
  let query = supabase.from('courses').select('full_text, synthesis');
  if (isUUID(fileId)) query = query.or(`id.eq.${fileId},file_id.eq.${fileId}`);
  else query = query.eq('file_id', fileId);
  const { data: cached } = await query.maybeSingle();
  const context = cached?.full_text || cached?.synthesis || '';

  if (!context) {
    throw new Error('No course content available to generate flashcards. The document may not have been processed yet.');
  }

  const attempts = [
    { provider: 'cerebras', model: 'llama-3.3-70b' },
    { provider: 'cerebras', model: 'llama3.1-70b' },
    { provider: 'cerebras', model: 'llama3.1-8b' },
    { provider: 'gemini', model: 'gemini-2.5-flash-lite' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'groq', model: 'llama-3.3-70b-versatile' }
  ];

  let lastError: any = null;
  for (const attempt of attempts) {
    try {
      console.log(`🧠 generateFlashcards: Attempting via ${attempt.provider} (${attempt.model})...`);
      let bodyPayload: any = {};

      if (attempt.provider === 'gemini') {
        bodyPayload = {
          provider: 'gemini',
          payload: {
            model: attempt.model,
            contents: [{ parts: [{ text: `Context: ${context}\n\nGenerate 15 academic flashcards in JSON. Return a "cards" array with "front" and "back".` }] }],
            generationConfig: { responseMimeType: "application/json" }
          }
        };
      } else {
        bodyPayload = {
          provider: attempt.provider,
          payload: {
            messages: [
              { 
                role: 'system', 
                content: 'You are an academic learning designer. Your job is to read the course context and generate a JSON object with a "cards" array (minimum 10-15 cards). Each card MUST contain: "front" (a concise concept name or question) and "back" (a detailed academic explanation). Return ONLY the raw JSON block without markdown formatting or code blocks.' 
              },
              { 
                role: 'user', 
                content: `Context: ${context}` 
              }
            ],
            model: attempt.model,
            stream: false
          }
        };
      }

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        throw new Error(`Gateway returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      let text = '';
      if (attempt.provider === 'gemini') {
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('Gemini returned no candidates');
        }
        text = data.candidates[0].content.parts[0].text;
      } else {
        text = data.choices?.[0]?.message?.content || '';
      }

      // Try parsing and validating
      text = text.trim();
      // Strip markdown code block if present
      if (text.startsWith('```json')) {
        text = text.substring(7);
      } else if (text.startsWith('```')) {
        text = text.substring(3);
      }
      if (text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      text = text.trim();

      const parsed = JSON.parse(text);
      if (parsed.cards && Array.isArray(parsed.cards)) {
        return parsed;
      } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        return { cards: parsed.flashcards };
      } else if (Array.isArray(parsed)) {
        return { cards: parsed };
      } else {
        throw new Error('JSON structure did not contain cards array');
      }
    } catch (err) {
      console.warn(`⚠️ generateFlashcards: ${attempt.provider} failed:`, err);
      lastError = err;
    }
  }

  throw new Error(`All flashcard generation attempts failed. Last error: ${lastError?.message}`);
}

// Service: Generate Smart Chat Title
export async function generateThreadTitle(userMessage: string) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        provider: 'cerebras',
        payload: {
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional thread title generator. Your ONLY task is to read the user\'s first message inside the <user_message> tag and generate a highly concise, punchy 3-5 word title summarizing what they want to discuss. \n\nCRITICAL RULE: DO NOT answer the user\'s message, DO NOT try to assist, and DO NOT ask questions. Simply output the 3-5 word title and nothing else. No quotes, no prefix.' 
            }, 
            { 
              role: 'user', 
              content: `<user_message>\n${userMessage}\n</user_message>` 
            }
          ],
          model: 'llama-3.3-70b',
          stream: false
        }
      })
    });

    if (!response.ok) throw new Error("Title generation gateway failed");

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Strip quotes
    title = title.replace(/['"]/g, '');
    
    // Security check: If the model ignored instructions and returned a long paragraph, fallback to slicing the user message!
    if (title.split(' ').length > 8) {
      return userMessage.trim().slice(0, 30) + '...';
    }
    
    return title || 'New Chat Session';
  } catch (e) {
    console.warn("Thread title generation failed, falling back to sliced message:", e);
    return userMessage.trim().slice(0, 30) + '...';
  }
}
