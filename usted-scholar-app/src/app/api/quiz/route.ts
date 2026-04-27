import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

    const base64Data = await fetchPdfBase64(fileId);
    if (!base64Data) return NextResponse.json({ error: 'Failed to fetch course material' }, { status: 500 });

    const promptText = `Analyze this lecture material and generate a high-quality quiz.
Return EXACTLY a JSON array of 5 objects. Each object must have:
- question: The question text
- options: An array of 4 strings
- correctIndex: The 0-based index of the correct option
- explanation: A short explanation why that answer is correct.

Only return the JSON array, no other text.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
            { text: promptText }
          ]
        }
      ]
    });

    const text = result.response.text();
    const jsonStr = text.match(/\[.*\]/s)?.[0] || text;
    const quiz = JSON.parse(jsonStr);

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Quiz API Error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
