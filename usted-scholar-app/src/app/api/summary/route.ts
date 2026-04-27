import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Fetch PDF directly from Google Drive (file must be shared "Anyone with the link")
async function fetchPdfAsBase64(fileId: string): Promise<string | null> {
  // Direct download URL for publicly shared Google Drive files
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(driveUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; USTED-Scholar/1.0)',
      },
      redirect: 'follow',
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Drive fetch failed: HTTP ${response.status} for fileId ${fileId}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.error(`Drive returned HTML for fileId ${fileId} — file may not be public`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');

  } catch (e: any) {
    clearTimeout(timeout);
    console.error(`Drive fetch error for fileId ${fileId}:`, e?.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { fileId, prompt } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const activePrompt = prompt || `Analyze this lecture material. Create a "Study Dashboard" including: 1. A high-level Executive Summary, 2. A list of Key Definitions, 3. 5 Essential Takeaways, and 4. A "Why this matters" section.`;

    const base64Data = await fetchPdfAsBase64(fileId);

    if (!base64Data) {
      return NextResponse.json({ 
        error: 'Could not load PDF. Ensure the Google Drive file is shared as "Anyone with the link".' 
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
