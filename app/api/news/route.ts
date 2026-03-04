import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    return NextResponse.json({ error: 'NEWSAPI_KEY not set' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=(conflict OR airstrike OR bombing OR shooting OR attack OR missile OR protest OR casualties)` +
      `&language=en&sortBy=publishedAt&pageSize=50`,
      {
        headers: { 'X-Api-Key': key },
        next: { revalidate: 300 },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'NewsAPI fetch failed' }, { status: 500 });
  }
}