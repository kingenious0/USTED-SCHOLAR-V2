import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

// Shared helper: fetch Base64 PDF from Apps Script with redirect:follow
async function fetchPdfBase64(fileId: string): Promise<string | null> {
  if (!APPS_SCRIPT_URL) {
    console.error('APPS_SCRIPT_WEBAPP_URL is not set');
    return null;
  }

  const scriptUrl = `${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`;

  try {
    // redirect:'follow' jumps past Google's script.google.com → script.googleusercontent.com redirect
    const response = await fetch(scriptUrl, {
      redirect: 'follow',
      headers: { 'Accept': 'text/plain' },
    });

    if (!response.ok) {
      console.error(`Apps Script HTTP ${response.status} for fileId ${fileId}`);
      return null;
    }

    // Apps Script returns raw Base64 text (not JSON)
    const base64Data = await response.text();

    if (!base64Data || base64Data.startsWith('Error') || base64Data.includes('<!doctype')) {
      console.error('Apps Script returned invalid data:', base64Data.slice(0, 200));
      return null;
    }

    return base64Data.trim();
  } catch (e: any) {
    console.error('fetchPdfBase64 error:', e?.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { fileId, prompt } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const activePrompt = prompt || `Analyze this lecture material. Create a "Study Dashboard" including:
1. A high-level Executive Summary
2. A list of Key Definitions  
3. 5 Essential Takeaways
4. A "Why this matters" section.`;

    const base64Data = await fetchPdfBase64(fileId);

    if (!base64Data) {
      return NextResponse.json({
        error: 'Failed to fetch course material. Check that APPS_SCRIPT_WEBAPP_URL is set on Vercel and the Apps Script is deployed as "Anyone".'
      }, { status: 500 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
            { text: activePrompt }
          ]
        }
      ]
    });

    return NextResponse.json({ markdown: response.text });

  } catch (error: any) {
    console.error('Summary API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 });
  }
}
