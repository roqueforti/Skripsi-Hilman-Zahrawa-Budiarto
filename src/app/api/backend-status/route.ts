import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rawUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  const PYTHON_API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${PYTHON_API_URL}/`, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return NextResponse.json({ status: 'ready' });
    }
    const errorText = await response.text();
    return NextResponse.json({ 
      status: 'loading', 
      error: `HTTP ${response.status} ${response.statusText}`,
      body: errorText.substring(0, 100) 
    }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ status: 'loading', error: error.message || 'Unknown error', url: PYTHON_API_URL }, { status: 503 });
  }
}
