// We use a dynamic import pattern to avoid Turbopack issues with pdfjs-dist
// during the initial build phase.

export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamic import of pdfjs-dist
  const pdfjs = await import('pdfjs-dist');
  
  // Configure worker only on client-side
  if (typeof window !== 'undefined') {
    // @ts-ignore
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    useWorkerFetch: false,
    useSystemFonts: true,
    isEvalSupported: false,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
  });
  
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}
