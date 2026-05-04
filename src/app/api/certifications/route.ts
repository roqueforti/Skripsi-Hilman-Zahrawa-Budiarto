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
  const proc = spawn(pythonPath, [scriptPath], { stdio: 'ignore', detached: true });
  proc.unref();
  console.log('Pre-extraction triggered after deletion');
}

// GET all files
export async function GET() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(UPLOAD_DIR)
      .filter(file => file.endsWith('.pdf')); // Only show PDFs, not cache files
    
    const fileList = files.map(file => {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        id: file,
        name: file,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        uploadDate: stats.mtime.toLocaleDateString('id-ID'),
        path: `/uploads/certifications/${file}`
      };
    });

    return NextResponse.json(fileList);
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar file' }, { status: 500 });
  }
}

// DELETE files
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const filenames = body.filenames || (body.filename ? [body.filename] : null);

    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json({ error: 'Nama file tidak diberikan' }, { status: 400 });
    }

    const deleted = [];
    const failed = [];

    for (const filename of filenames) {
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted.push(filename);
      } else {
        failed.push(filename);
      }
    }

    // Re-build cache after deletion
    runPreprocessing();

    return NextResponse.json({ 
      message: `${deleted.length} file berhasil dihapus`,
      deleted,
      failed
    });
  } catch (error) {
    console.error('Error deleting files:', error);
    return NextResponse.json({ error: 'Gagal menghapus file' }, { status: 500 });
  }
}
