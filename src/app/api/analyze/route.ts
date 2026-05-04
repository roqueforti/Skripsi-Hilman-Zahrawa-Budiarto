import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { profileText } = await request.json();

    if (!profileText) {
      return NextResponse.json({ error: 'Teks profil tidak ditemukan' }, { status: 400 });
    }

    const PYTHON_API_URL = process.env.PYTHON_API_URL;

    // Load domain data from local cache (JSON)
    const projectRoot = process.cwd();
    const cachePath = path.join(projectRoot, 'public', 'uploads', 'certifications', 'domain_cache.json');
    
    if (!fs.existsSync(cachePath)) {
      return NextResponse.json({ error: 'Data sertifikasi belum tersedia. Silakan unggah file melalui Admin.' }, { status: 400 });
    }

    const domainCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    
    // Prepare domains object for Python API
    const domains: Record<string, string> = {};
    for (const [filename, data] of Object.entries(domainCache)) {
      if (typeof data === 'string') {
        domains[filename] = data;
      } else if (typeof data === 'object' && data !== null) {
        // @ts-ignore
        domains[filename] = data.translated || data.raw || "";
      }
    }

    // IF PYTHON_API_URL is set, use the external API (Hybrid Mode)
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
        return NextResponse.json(result);
      } catch (apiError) {
        console.error('Failed to call external NLP API:', apiError);
        return NextResponse.json({ error: 'Gagal menghubungi NLP Backend' }, { status: 502 });
      }
    }

    // FALLBACK: Use local Python spawn (for local development ONLY)
    // Note: This will not work on Vercel
    const { spawn } = require('child_process');
    const venvPaths = [
      path.join(projectRoot, 'venv', 'Scripts', 'python.exe'),
      path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
      path.join(projectRoot, 'venv', 'bin', 'python'),
      path.join(projectRoot, '.venv', 'bin', 'python'),
    ];

    let pythonPath = 'python';
    for (const p of venvPaths) {
      if (fs.existsSync(p)) {
        pythonPath = p;
        break;
      }
    }

    const scriptPath = path.join(projectRoot, 'scripts', 'analyzer.py');

    return new Promise((resolve) => {
      const pythonProcess = spawn(pythonPath, [scriptPath]);
      let resultData = '';
      let errorData = '';

      pythonProcess.stdin.write(profileText);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data: any) => {
        const output = data.toString();
        // Check if it's the final result (contains "results")
        if (output.includes('"results":')) {
          resultData = output;
        }
      });

      pythonProcess.stderr.on('data', (data: any) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code: number) => {
        if (code !== 0) {
          console.error(`Local Python Error: ${errorData}`);
          resolve(NextResponse.json({ error: 'Gagal menjalankan analisis lokal' }, { status: 500 }));
        } else {
          try {
            const finalJson = JSON.parse(resultData);
            resolve(NextResponse.json(finalJson));
          } catch (e) {
            resolve(NextResponse.json({ error: 'Format hasil analisis tidak valid' }, { status: 500 }));
          }
        }
      });
    });

  } catch (error) {
    console.error('Internal API Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
