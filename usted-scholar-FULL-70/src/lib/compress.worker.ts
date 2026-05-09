import { PDFDocument } from 'pdf-lib';

// Add listener for compression tasks
self.onmessage = async (e: MessageEvent) => {
  const { arrayBuffer } = e.data;
  
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // This is the "magic" - save with useObjectStreams: true 
    // which compresses the internal PDF structure and strips metadata
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    // Send back the compressed bytes as a Transferable object for performance
    self.postMessage({ compressedBytes }, [compressedBytes.buffer] as any);
  } catch (error: any) {
    self.postMessage({ error: error.message || "Compression failed" });
  }
};
