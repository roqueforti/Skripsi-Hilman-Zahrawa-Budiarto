export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${PYTHON_API_URL}/`, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return NextResponse.json({ status: 'ready' });
    }
    return NextResponse.json({ status: 'loading' }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ status: 'loading' }, { status: 503 });
  }
}
