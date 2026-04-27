import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || ''; 
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

export async function POST(req: Request) {
  try {
    const { fileId, prompt } = await req.json();
    
    if (!fileId || !APPS_SCRIPT_URL) {
      return NextResponse.json({ error: 'Missing fileId or configuration' }, { status: 400 });
    }

    const activePrompt = prompt || `Analyze this lecture material. Create a "Study Dashboard" including: 1. A high-level Executive Summary, 2. A list of Key Definitions, 3. 5 Essential Takeaways, and 4. A "Why this matters" section.`;

    let pdfInlineData = null;

    try {
      const pdfResponse = await fetch(`${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`, {
        cache: 'force-cache' // CACHE THE GIGANTIC PDF FOREVER
      });
      const pdfJson = await pdfResponse.json();
      
      if (pdfJson.data) {
        pdfInlineData = {
          inlineData: {
            data: pdfJson.data,
            mimeType: "application/pdf"
          }
        };
      }
    } catch (e) {
      console.error("Failed to fetch PDF from Apps Script:", e);
      return NextResponse.json({ error: 'Failed to fetch course material' }, { status: 500 });
    }

    if (!pdfInlineData) {
      return NextResponse.json({ error: 'Failed to extract PDF data' }, { status: 500 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            pdfInlineData,
            { text: activePrompt }
          ]
        }
      ]
    });

    return NextResponse.json({ 
      markdown: response.text 
    });
  } catch (error: any) {
    console.error("Gemini API Error (Summary):", error);
    return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 });
  }
}
