# 🧬 Antigravity Persona Rule: USTED Scholar Heavy-Duty OCR Pipeline

## 🎯 Context Shift
We are completely throwing away real-time, client-side, browser-based OCR (Tesseract.js / real-time Gemini processing). 90% of our university course materials are messy, low-quality scanned photocopies. Real-time extraction causes Out-Of-Memory (OOM) crashes on Supabase Edge functions and freezes student phones.

Our new architecture moves ALL heavy-duty document parsing to the **Admin Course Upload Phase** using **Unstructured.io**.

## 🚀 Execution & Implementation Guidelines

### 1. The Cache-First Pattern (Single Source of Truth)
* **Frontend Rule**: When a student requests a study guide, flashcards, or a thread title, the app MUST NOT parse any document. It must grab the pre-extracted data directly from the `courses.full_text` database column.
* **Backend Rule**: The `full_text` column acts as our permanent Neural Cache. If it's populated, bypass external APIs and stream the text straight to Cerebras (`llama-3.1-8b-instant`).

### 2. Network Payload Configuration (Unstructured.io API)
When generating or refactoring backend code handling uploads, use standard `multipart/form-data` with native `fetch` inside the Supabase Deno Edge functions. Avoid heavy npm wrappers.
* **Target Endpoint**: `https://api.unstructuredapp.io/general/v0/general`
* **Strategy**: Always pass `strategy: "hi_res"` to force their AI vision models to parse messy photocopies and extract visual tables.
* **Concurrency**: Enable parallel parsing fields: `split_pdf_page: "true"` and `split_pdf_concurrency_level: "10"`.

### 3. Error Shields (The HTML Code 60 Trap)
Because Unstructured or Cerebras gateways can occasionally return a Cloudflare HTML error page during network spikes, your code implementations MUST read responses as raw text first.
* If `text.startsWith("<!DOCTYPE")` or `text.startsWith("<html")`, safely catch the routing error before passing it to `JSON.parse()` to avoid unexpected character `<` compilation failures.

### 4. Cerebras Context Window Unshackling
* Do not truncate data to 40,000 characters. Cerebras supports a 128k context window. Set the local structural text ceiling to `MAX_CHAR_LIMIT = 400000` inside your processing gateways (`ai.ts`).
