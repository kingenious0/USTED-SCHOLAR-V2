import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Fetch PDF directly from Google Drive (file must be shared "Anyone with the link")
async function fetchPdfAsBase64(fileId: string): Promise<string | null> {
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(driveUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; USTED-Scholar/1.0)' },
      redirect: 'follow',
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.error(`Drive returned HTML for fileId ${fileId} — file may not be public`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (e: any) {
    clearTimeout(timeout);
    console.error(`Drive fetch error:`, e?.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message, history, fileId } = await req.json();
    
    let pdfInlineData = null;

    // 1. Fetch PDF directly from Google Drive
    if (fileId) {
      const base64Data = await fetchPdfAsBase64(fileId);
      if (base64Data) {
        pdfInlineData = {
          inlineData: { data: base64Data, mimeType: "application/pdf" }
        };
      } else {
        console.warn(`Could not load PDF for fileId: ${fileId}. Chat will proceed without PDF context.`);
      }
    }

    // 2. Format history for Gemini
    const contents = history.map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add current message and PDF context
    const currentMessageParts: any[] = [{ text: message }];
    if (pdfInlineData) {
      currentMessageParts.unshift(pdfInlineData); // Add PDF as first part of the current prompt
    }

    contents.push({
      role: 'user',
      parts: currentMessageParts
    });

    // 3. The Scholar Persona (System Instruction)
    const systemInstruction = `You are the USTED Scholar AI, a highly advanced academic assistant. Your goal is to guide the student through their lecture materials. Always cite the relevant parts of the text. Keep responses structured, professional, and visually pleasing. Format with Markdown.`;

    // 4. Generate Content Stream (Google Search Disabled for Maximum Speed)
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        // Google Search is disabled to eliminate the 5-10 second lookup latency
      }
    });

    // 5. Create a standard Web ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
             if (chunk.text) {
                controller.enqueue(new TextEncoder().encode(chunk.text));
             }
          }
        } catch (e: any) {
          console.error("Stream Error:", e);
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
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
  }
}
