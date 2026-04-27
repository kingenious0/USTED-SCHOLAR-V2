"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export function PdfViewer({ fileId, title }: { fileId: string; title: string }) {
  const [loading, setLoading] = useState(true);
  
  // Point to internal proxy that fetches from Apps Script securely
  const pdfUrl = `/api/pdf?fileId=${fileId}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

  return (
    <div className="w-full h-full relative flex flex-col bg-[#E5E5E5] dark:bg-[#080808]">

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
           <div className="relative w-16 h-16 mb-6">
             <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-white/5"></div>
             <div className="absolute inset-0 rounded-full border-4 border-[#8C033B] border-t-transparent animate-spin"></div>
           </div>
           <p className="text-sm font-bold opacity-60">Decrypting Knowledge Base...</p>
        </div>
      )}

      {/* iframe container with a wrapper to help block context menus if needed */}
      <div className="w-full h-full relative z-0" onContextMenu={(e) => e.preventDefault()}>
        <iframe
          src={pdfUrl}
          className={`w-full h-full border-none transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          title={title}
        />
      </div>
    </div>
  );
}
