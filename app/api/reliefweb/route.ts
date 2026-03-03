import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '20';

  try {
    const res = await fetch(
      `https://api.reliefweb.int/v1/reports?` +
      `appname=sentinel-monitor` +
      `&limit=${limit}` +
      `&preset=latest` +
      `&fields[include][]=title` +
      `&fields[include][]=date.created` +
      `&fields[include][]=country.name` +
      `&fields[include][]=primary_country.name` +
      `&fields[include][]=primary_country.iso3` +
      `&fields[include][]=source.name`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'ReliefWeb fetch failed' }, { status: 500 });
  }
}
