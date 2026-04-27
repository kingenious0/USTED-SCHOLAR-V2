import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Initialize Gemini with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Replace this with your actual Google Apps Script Web App URL
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || ''; 
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

export async function POST(req: Request) {
  try {
    const { message, history, fileId } = await req.json();
    
    let pdfInlineData = null;

    // 1. Bridge Logic: Fetch Base64 PDF from Apps Script
    if (fileId && APPS_SCRIPT_URL) {
      try {
        const pdfResponse = await fetch(`${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`, {
          next: { revalidate: 3600 } // Cache for 1 hour (Vercel-compatible)
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
