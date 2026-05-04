import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const { profileText } = await request.json();

    if (!profileText) {
      return NextResponse.json({ error: 'Teks profil tidak ditemukan' }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const envPythonPath = process.env.PYTHON_PATH;
    const venvPaths = [
      path.join(projectRoot, 'venv', 'Scripts', 'python.exe'),
      path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
      path.join(projectRoot, 'venv', 'bin', 'python'),
      path.join(projectRoot, '.venv', 'bin', 'python'),
    ];

    let pythonPath = 'python';
    if (envPythonPath && envPythonPath !== 'python' && fs.existsSync(envPythonPath)) {
      pythonPath = envPythonPath;
    } else {
      for (const p of venvPaths) {
        if (fs.existsSync(p)) {
          pythonPath = p;
          break;
        }
      }
    }

    const scriptPath = path.join(projectRoot, 'scripts', 'analyzer.py');

    // Create a ReadableStream to stream Python stdout to the client
    const stream = new ReadableStream({
      start(controller) {
        const pythonProcess = spawn(pythonPath, [scriptPath]);
        
        // Write input to stdin
        pythonProcess.stdin.write(profileText);
        pythonProcess.stdin.end();

        // Handle stdout (progress markers and final results)
        pythonProcess.stdout.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        // Handle stderr (errors)
        pythonProcess.stderr.on('data', (data) => {
          const msg = data.toString();
          console.error(`Python stderr: ${msg}`);
          // We don't close the stream here to allow stdout to finish if possible,
          // but we log it for server-side debugging.
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: 'Gagal menjalankan Python' })));
          controller.close();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
          }
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson', // Using newline-delimited JSON format
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
