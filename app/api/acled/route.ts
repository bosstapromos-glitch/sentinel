import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '100';
  const days = searchParams.get('days') || '7';

  const dateFrom = new Date(Date.now() - parseInt(days) * 86400000)
    .toISOString().slice(0, 10);

  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;

  if (!key || !email) {
    return NextResponse.json({
      error: 'ACLED_API_KEY and ACLED_EMAIL not set in .env.local',
      hint: 'Register free at https://developer.acleddata.com'
    }, { status: 503 });
  }

  try {
    const url = `https://api.acleddata.com/acled/read?` +
      `key=${key}&email=${email}` +
      `&limit=${limit}` +
      `&event_date=${dateFrom}|${new Date().toISOString().slice(0, 10)}` +
      `&event_date_where=BETWEEN` +
      `&fields=event_id_cnty|event_date|event_type|sub_event_type|actor1|country|admin1|location|latitude|longitude|fatalities|source|notes`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'ACLED fetch failed' }, { status: 500 });
  }
}