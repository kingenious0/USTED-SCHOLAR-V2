import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStoragePath, fetchStoragePdfBase64 } from '@/lib/storage';
import Groq from 'groq-sdk';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

// Legacy fallback: fetch Base64 PDF from Apps Script
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
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { fileId, prompt } = await req.json();
    if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });

    const activePrompt = prompt || 'Analyze this material.';

    // 1. Check for Cached Full Text
    const { data: course } = await supabase
      .from('courses')
      .select('full_text, storage_path')
      .eq('file_id', fileId)
      .single();

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 2. If Full Text Exists -> Use GROQ (Instant)
    if (course?.full_text) {
      (async () => {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are the USTED Scholar AI. Provide deep academic analysis in Markdown.' },
              { role: 'user', content: `Context: ${course.full_text}\n\nTask: ${activePrompt}` }
            ],
            model: 'llama-3.3-70b-versatile',
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) await writer.write(encoder.encode(content));
          }
        } catch (err: any) {
          console.error('Groq Error:', err);
          await writer.write(encoder.encode(`Error during Groq synthesis: ${err.message}`));
        } finally {
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 3. Fallback: Fetch PDF (Storage then Drive) and use Gemini
    let base64Data = null;
    if (course?.storage_path) {
       base64Data = await fetchStoragePdfBase64(course.storage_path);
    }
    
    if (!base64Data) {
       base64Data = await fetchPdfBase64(fileId);
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'Failed to fetch course material from Storage or Drive.' }, { status: 500 });
    }

    (async () => {
      try {
        const result = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash-lite',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
              { text: `${activePrompt}\n\nIMPORTANT: After your analysis, add the separator "---TEXT_EXTRACT_START---" followed by the full text extraction of the document.` }
            ]
          }]
        });

        let fullResponse = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullResponse += text;
          
          const displayPart = fullResponse.split('---TEXT_EXTRACT_START---')[0];
          const previousDisplayPart = (fullResponse.length - text.length > 0) 
            ? fullResponse.substring(0, fullResponse.length - text.length).split('---TEXT_EXTRACT_START---')[0]
            : '';
          
          const newText = displayPart.substring(previousDisplayPart.length);
          if (newText) await writer.write(encoder.encode(newText));
        }

        const parts = fullResponse.split('---TEXT_EXTRACT_START---');
        if (parts.length > 1) {
          const extractedText = parts[1].trim();
          await supabase
            .from('courses')
            .update({ full_text: extractedText })
            .eq('file_id', fileId);
        }

      } catch (err: any) {
        console.error('Gemini Error:', err);
        await writer.write(encoder.encode(`Error during Gemini extraction: ${err.message}`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('Summary API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
