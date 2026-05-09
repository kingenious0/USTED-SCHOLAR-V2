import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStoragePath } from '@/lib/storage';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBAPP_URL || process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) return new NextResponse('Missing fileId', { status: 400 });

  try {
    // 1. Try Supabase Storage First
    const storagePath = await getStoragePath(fileId);
    if (storagePath) {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(storagePath);

      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${storagePath}"`,
          },
        });
      }
    }

    // 2. Legacy Fallback: Google Drive Bridge
    if (APPS_SCRIPT_URL) {
      const scriptUrl = `${APPS_SCRIPT_URL}?fileId=${fileId}&key=${APPS_SCRIPT_SECRET}`;
      const response = await fetch(scriptUrl, { redirect: 'follow' });

      if (response.ok) {
        const base64Data = await response.text();
        if (base64Data && !base64Data.startsWith('Error')) {
          const buffer = Buffer.from(base64Data.trim(), 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${fileId}.pdf"`,
            },
          });
        }
      }
    }

    return new NextResponse('File not found in Storage or Drive', { status: 404 });

  } catch (error: any) {
    console.error('PDF Fetch Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
