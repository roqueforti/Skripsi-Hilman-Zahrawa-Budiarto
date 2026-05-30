import { NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdf';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const rawUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    const PYTHON_API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    const savedRecords = [];

    for (const file of files) {
      try {
        // 1. Extract text directly from PDF
        const rawText = await extractTextFromPdf(file);
        
        let translatedText = null;

        // 2. Translate if Python API is available
        if (PYTHON_API_URL && rawText.trim()) {
          try {
            const translateRes = await fetch(`${PYTHON_API_URL}/translate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: rawText.substring(0, 10000) }), // Limit to 10k chars for safety
            });
            if (translateRes.ok) {
              const data = await translateRes.json();
              translatedText = data.translated;
            }
          } catch (err) {
            console.error('Translation failed during upload:', err);
          }
        }

        const displayName = file.name
          .replace('.pdf', '')
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // 3. Save to Database
        const certification = await prisma.certification.create({
          data: {
            name: displayName,
            institution: 'Certiport',
            category: 'Certification',
            rawText: rawText,
            translatedText: translatedText,
            pdfPath: file.name,
          },
        });

        savedRecords.push(certification.name);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
      }
    }

    return NextResponse.json({ 
      message: `${savedRecords.length} sertifikasi berhasil disimpan ke database`,
      data: savedRecords 
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}
