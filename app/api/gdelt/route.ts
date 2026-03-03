import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'conflict OR shooting OR terrorism OR attack OR airstrike OR bombing';

  try {
    const res = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?` +
      `query=${encodeURIComponent(query)}` +
      `&mode=artlist&maxrecords=50&format=json&sort=datedesc`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'GDELT fetch failed' }, { status: 500 });
  }
}