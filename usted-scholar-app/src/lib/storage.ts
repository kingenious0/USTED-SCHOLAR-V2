import { supabase } from './supabase';

/**
 * Fetches a PDF from Supabase Storage and returns it as a Base64 string.
 * This is used for sending PDF context to Gemini/AI models.
 */
export async function fetchStoragePdfBase64(storagePath: string): Promise<string | null> {
  try {
    // 1. Create a signed URL (expires in 60 seconds)
    const { data, error } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error?.message);
      return null;
    }

    // 2. Fetch the file from the signed URL
    const response = await fetch(data.signedUrl);
    if (!response.ok) {
      console.error('Error fetching file from storage:', response.statusText);
      return null;
    }

    // 3. Convert to Base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (err) {
    console.error('fetchStoragePdfBase64 error:', err);
    return null;
  }
}

/**
 * Resolves a fileId to a storage_path by querying the courses table.
 */
export async function getStoragePath(fileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('storage_path')
    .eq('file_id', fileId)
    .single();

  if (error || !data?.storage_path) {
    return null;
  }
  return data.storage_path;
}
