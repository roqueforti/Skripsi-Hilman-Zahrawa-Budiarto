import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${PYTHON_API_URL}/`, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return NextResponse.json({ status: 'ready' });
    }
    return NextResponse.json({ status: 'loading', error: 'Response not ok' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ status: 'loading', error: error.message || 'Unknown error', url: PYTHON_API_URL }, { status: 503 });
  }
}
