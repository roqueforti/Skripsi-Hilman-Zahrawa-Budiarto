export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all certifications from Database
export async function GET(request: Request) {
  try {
    const certifications = await prisma.certification.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const fileList = certifications.map(cert => ({
      id: cert.id,
      name: cert.name,
      size: cert.rawText ? (cert.rawText.length / 1024).toFixed(2) + ' KB' : '0 KB',
      uploadDate: cert.createdAt.toLocaleDateString('id-ID'),
      institution: cert.institution,
      category: cert.category
    }));

    return NextResponse.json(fileList);
  } catch (error) {
    console.error('Error reading database:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar sertifikasi' }, { status: 500 });
  }
}

// DELETE certification from Database
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const ids = body.ids || (body.id ? [body.id] : null);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    }

    const deleted = await prisma.certification.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ 
      message: `${deleted.count} sertifikasi berhasil dihapus`,
      deletedCount: deleted.count
    });
  } catch (error) {
    console.error('Error deleting records:', error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
