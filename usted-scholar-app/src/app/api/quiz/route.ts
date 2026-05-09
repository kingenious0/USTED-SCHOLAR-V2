import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { fetchStoragePdfBase64 } from '@/lib/storage';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

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
    const { fileId } = await req.json();
    if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });

    // 1. Check for Cached Full Text
    const { data: course } = await supabase
      .from('courses')
      .select('full_text, storage_path')
      .eq('file_id', fileId)
      .single();

    const promptText = `Generate a high-quality academic quiz based on the material.
Return EXACTLY a JSON array of 5 objects. Each object MUST have:
- question: The question text
- options: An array of 4 strings
- correctIndex: The 0-based index of the correct option
- explanation: A short explanation.`;

    // 2. If Text is Cached -> Use Cerebras (Fastest)
    if (course?.full_text) {
      try {
        const response = await cerebras.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are an examiner. Return valid JSON only.' },
            { role: 'user', content: `Context: ${course.full_text}\n\nTask: ${promptText}` }
          ],
          model: 'llama3.1-8b',
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (content) {
          const parsed = JSON.parse(content);
          return NextResponse.json(parsed.questions || parsed);
        }
      } catch (err) {
        console.warn('Cerebras Quiz failed, falling back to Gemini', err);
      }
    }

    // 3. Fallback: Fetch PDF (Storage then Drive)
    let base64Data = null;
    if (course?.storage_path) {
      base64Data = await fetchStoragePdfBase64(course.storage_path);
    }
    if (!base64Data) {
      base64Data = await fetchPdfBase64(fileId);
    }

    if (!base64Data) return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 });

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
          { text: `${promptText}\n\nIMPORTANT: After your JSON, add "---TEXT_END---" followed by the full text extraction.` }
        ]
      }]
    });

    const responseText = result.text;
    const jsonStr = responseText.split('---TEXT_END---')[0].match(/\[[\s\S]*\]/)?.[0] || responseText;
    const quiz = JSON.parse(jsonStr);

    const extraction = responseText.split('---TEXT_END---')[1];
    if (extraction) {
      await supabase.from('courses')
        .update({ full_text: extraction.trim() })
        .eq('file_id', fileId);
    }

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Quiz API Error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
