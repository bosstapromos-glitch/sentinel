import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radius = searchParams.get('radius') || '50';

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const key = process.env.WINDY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'WINDY_API_KEY not set in environment' }, { status: 503 });
  }

  try {
    const url = `https://api.windy.com/webcams/api/v3/webcams?lang=en&nearby=${lat},${lon},${radius}&include=images,location,player,urls&limit=10`;
    
    console.log('Fetching cameras from:', url);
    console.log('Using key:', key.slice(0, 6) + '...');

    const res = await fetch(url, {
      headers: {
        'x-windy-api-key': key,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ 
        error: 'Windy API error',
        status: res.status,
        detail: errorText,
        keyPrefix: key.slice(0, 6),
      }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Camera fetch failed',
      detail: error?.message 
    }, { status: 500 });
  }
}
