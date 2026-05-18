import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ 
    status: "API Is Ready",
    timestamp: new Date().toISOString(),
    mode: process.env.PYTHON_API_URL ? "Hybrid (Hugging Face)" : "Local (Script)"
  });
}

export async function POST(request: Request) {
  try {
    const { profileText, clientName = "Manual Input" } = await request.json();

    if (!profileText) {
      return NextResponse.json({ error: 'Teks profil tidak ditemukan' }, { status: 400 });
    }

    const PYTHON_API_URL = process.env.PYTHON_API_URL;

    // 1. Fetch certifications from Database
    const certifications = await prisma.certification.findMany({
      select: {
        name: true,
        rawText: true,
        translatedText: true,
        institution: true,
        category: true,
      }
    });
    
    if (certifications.length === 0) {
      return NextResponse.json({ 
        error: 'Data sertifikasi belum tersedia di database. Silakan upload melalui halaman Admin terlebih dahulu.' 
      }, { status: 400 });
    }

    // 2. Prepare domains object for Python API
    const domains: Record<string, string> = {};
    certifications.forEach(cert => {
      // Use translated text if available, otherwise raw text
      domains[cert.name] = cert.translatedText || cert.rawText || "";
    });

    // 3. Call External Python NLP API (Hybrid Mode)
    if (PYTHON_API_URL) {
      console.log(`Using Hybrid NLP API at: ${PYTHON_API_URL}`);
      try {
        const response = await fetch(`${PYTHON_API_URL}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileText, domains }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`NLP API Error: ${errorData}`);
        }

        const result = await response.json();
        
        // Enrich results with DB data
        const enrichedResults = result.results.map((r: any) => {
          const original = certifications.find(c => c.name === r.name);
          return {
            ...r,
            institution: original?.institution || r.institution,
            category: original?.category || r.category,
          };
        });

        // Save to History
        if (enrichedResults.length > 0) {
          try {
            await prisma.analysisHistory.create({
              data: {
                clientName,
                profileText,
                topResult: enrichedResults[0].name,
                matchScore: enrichedResults[0].matchScore,
                detailedResults: JSON.stringify(enrichedResults),
              }
            });
          } catch (historyErr) {
            console.error('Failed to save analysis history:', historyErr);
            // Don't fail the request if history saving fails
          }
        }

        return NextResponse.json({ results: enrichedResults });
      } catch (apiError) {
        console.error('Failed to call external NLP API:', apiError);
        return NextResponse.json({ 
          error: 'Gagal menghubungi NLP Backend (Python). Pastikan proses backend sudah selesai loading (Uvicorn running on port 8000).' 
        }, { status: 502 });
      }
    }

    return NextResponse.json({ 
      error: 'PYTHON_API_URL belum dikonfigurasi di Vercel.' 
    }, { status: 501 });

  } catch (error: any) {
    console.error('Internal API Error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan internal pada server',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
