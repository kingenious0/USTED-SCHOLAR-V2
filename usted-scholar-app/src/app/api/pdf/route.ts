import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }

  // Use APPS_SCRIPT_WEBAPP_URL from .env.local
  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
  const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

  if (!APPS_SCRIPT_URL) {
    return new NextResponse('Missing Apps Script URL configuration', { status: 500 });
  }

  try {
    const url = `${APPS_SCRIPT_URL}?fileId=${fileId}${APPS_SCRIPT_SECRET ? `&key=${APPS_SCRIPT_SECRET}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch from Apps Script: ${response.status}`, { status: response.status });
    }

    const data = await response.json();

    if (data.error) {
       console.error("Apps Script Error:", data.error);
       return new NextResponse(data.error, { status: 401 });
    }

    if (!data.data) {
      return new NextResponse('Invalid response from Apps Script: no base64 data', { status: 500 });
    }

    // Convert base64 to binary buffer
    const buffer = Buffer.from(data.data, 'base64');

    // Return as PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Proxy Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
