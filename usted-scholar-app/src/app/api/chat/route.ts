import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

// Fetch Base64 PDF from Apps Script with redirect:follow
async function fetchPdfBase64(fileId: string): Promise<string | null> {
  if (!APPS_SCRIPT_URL) return null;

  const scriptUrl = `${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`;

  try {
    // redirect:'follow' is the key fix — handles Google's internal redirect chain
    const response = await fetch(scriptUrl, {
      redirect: 'follow',
      headers: { 'Accept': 'text/plain' },
    });

    if (!response.ok) return null;

    const base64Data = await response.text();

    if (!base64Data || base64Data.startsWith('Error') || base64Data.includes('<!doctype')) {
      console.warn('Apps Script returned invalid data for chat:', base64Data.slice(0, 100));
      return null;
    }

    return base64Data.trim();
  } catch (e: any) {
    console.error('Chat PDF fetch error:', e?.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message, history, fileId } = await req.json();

    let pdfInlineData = null;

    // Fetch PDF if fileId provided — chat works with or without PDF context
    if (fileId) {
      const base64Data = await fetchPdfBase64(fileId);
      if (base64Data) {
        pdfInlineData = {
          inlineData: { data: base64Data, mimeType: 'application/pdf' }
        };
      } else {
        console.warn(`PDF unavailable for fileId ${fileId} — chat continues without context`);
      }
    }

    // Format conversation history for Gemini
    const contents = history.map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Build current message — PDF goes first as context
    const currentMessageParts: any[] = [];
    if (pdfInlineData) currentMessageParts.push(pdfInlineData);
    currentMessageParts.push({ text: message });

    contents.push({ role: 'user', parts: currentMessageParts });

    const systemInstruction = `You are the USTED Scholar AI, a highly advanced academic assistant for USTED students. 
Your goal is to guide the student through their lecture materials. 
Always cite the relevant parts of the text. 
Keep responses structured, professional, and visually pleasing. 
Format with Markdown.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { systemInstruction }
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
        } catch (e: any) {
          console.error('Stream Error:', e);
          controller.enqueue(new TextEncoder().encode(`\n[Stream Error: ${e.message}]`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
  }
}
