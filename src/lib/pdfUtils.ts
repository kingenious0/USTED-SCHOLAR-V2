import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js Worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractTextFromPdf(buffer: ArrayBuffer, onProgress?: (page: number, total: number) => void): Promise<string> {
  try {
    // Clone buffer to prevent detachment issues
    const data = new Uint8Array(buffer.slice(0));
    const pdf = await pdfjs.getDocument({ data }).promise;
    let fullText = '';
    
    // Initialize Tesseract Scheduler for Parallel Processing
    // @ts-ignore
    const { createWorker, createScheduler } = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/+esm');
    const scheduler = createScheduler();
    
    // Create 4 parallel workers for maximum speed
    const workerPromises = Array(4).fill(null).map(async () => {
      const worker = await createWorker('eng');
      scheduler.addWorker(worker);
    });
    await Promise.all(workerPromises);

    const ocrJobs: Promise<any>[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      const pageText = strings.join(' ').trim();
      
      if (pageText.length > 20) {
        fullText += pageText + '\n';
      } else {
        if (onProgress) onProgress(i, pdf.numPages);
        const viewport = page.getViewport({ scale: 1.5 }); // Optimized scale for speed
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        
        // Add to parallel queue
        const job = scheduler.addJob('recognize', canvas).then((res: any) => {
          return { index: i, text: res.data.text };
        });
        ocrJobs.push(job);
      }
    }
    
    // Wait for all parallel jobs to finish
    let completed = 0;
    const results = await Promise.all(ocrJobs.map(job => 
      job.then(res => {
        completed++;
        if (onProgress) onProgress(completed, ocrJobs.length);
        return res;
      })
    ));

    results.sort((a, b) => a.index - b.index).forEach(r => {
      fullText += r.text + '\n';
    });

    await scheduler.terminate();
    return fullText.trim();
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    return '';
  }
}
