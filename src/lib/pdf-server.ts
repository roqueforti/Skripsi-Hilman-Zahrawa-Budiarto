// @ts-ignore
import pdfParse from 'pdf-parse';

export async function extractTextFromPdfServer(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const data = await pdfParse(buffer);
  return data.text.trim();
}
