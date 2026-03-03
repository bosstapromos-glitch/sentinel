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
    return NextResponse.json({
      error: 'WINDY_API_KEY not set',
      hint: 'Get free key at https://api.windy.com/webcams'
    }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.windy.com/webcams/api/v3/webcams?` +
      `nearby=${lat},${lon},${radius}&limit=10&include=images,location,player`,
      {
        headers: { 'x-windy-api-key': key },
        next: { revalidate: 600 }
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Camera fetch failed' }, { status: 500 });
  }
}