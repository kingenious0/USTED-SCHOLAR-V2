import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }
  if (!APPS_SCRIPT_URL) {
    return new NextResponse('Missing Apps Script URL configuration', { status: 500 });
  }

  try {
    const scriptUrl = `${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`;

    // redirect:'follow' is the key fix — Google redirects script.google.com → script.googleusercontent.com
    const response = await fetch(scriptUrl, {
      redirect: 'follow',
      headers: { 'Accept': 'text/plain' },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Apps Script HTTP ${response.status}:`, errText.slice(0, 300));
      return new NextResponse(`Bridge Error ${response.status}`, { status: 500 });
    }

    // Apps Script returns raw Base64 text (not JSON)
    const base64Data = await response.text();

    if (!base64Data || base64Data.startsWith('Error') || base64Data.includes('<!doctype')) {
      console.error('Apps Script returned invalid data:', base64Data.slice(0, 300));
      return new NextResponse('Bridge returned invalid data', { status: 500 });
    }

    // Convert base64 → binary → return as PDF
    const buffer = Buffer.from(base64Data.trim(), 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('PDF Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
