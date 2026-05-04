import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'certifications');

function getPythonPath(): string {
  const projectRoot = process.cwd();
  const envPythonPath = process.env.PYTHON_PATH;
  const venvPaths = [
    path.join(projectRoot, 'venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, 'venv', 'bin', 'python'),
    path.join(projectRoot, '.venv', 'bin', 'python'),
  ];

  if (envPythonPath && envPythonPath !== 'python' && fs.existsSync(envPythonPath)) {
    return envPythonPath;
  }
  for (const p of venvPaths) {
    if (fs.existsSync(p)) return p;
  }
  return envPythonPath || 'python';
}

function runPreprocessing(): void {
  const scriptPath = path.join(process.cwd(), 'scripts', 'preprocess.py');
  const pythonPath = getPythonPath();
  
  // Fire and forget - runs in background
  const proc = spawn(pythonPath, [scriptPath], { stdio: 'ignore', detached: true });
  proc.unref();
  console.log('Pre-extraction triggered in background');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const savedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = file.name.replace(/\s+/g, '_'); // Replace spaces with underscores
      const filePath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filePath, buffer);
      savedFiles.push(filename);
    }

    // Trigger pre-extraction in background after upload
    runPreprocessing();

    return NextResponse.json({ 
      message: `${savedFiles.length} file berhasil diunggah`,
      files: savedFiles 
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}
