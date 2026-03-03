import { NextResponse } from 'next/server';

export async function GET() {
  const events: any[] = [];

  // GDELT GEO API - free, no key, gives us geocoded events
  try {
    const res = await fetch(
      'https://api.gdeltproject.org/api/v2/geo/geo?query=conflict%20OR%20attack%20OR%20bombing%20OR%20shooting%20OR%20protest%20OR%20airstrike&format=GeoJSON&timespan=1d',
      { next: { revalidate: 300 } }
    );
    const data = await res.json();

    if (data.features) {
      data.features.forEach((f: any, i: number) => {
        const coords = f.geometry?.coordinates;
        const props = f.properties || {};
        if (coords && coords[0] && coords[1]) {
          events.push({
            id: 'gdelt_geo_' + i + '_' + Date.now(),
            type: guessType(props.name || ''),
            headline: (props.name || 'Event reported').slice(0, 140),
            lat: coords[1],
            lon: coords[0],
            locality: props.name?.split(',')[0] || 'Unknown',
            country: props.country || props.name?.split(',').pop()?.trim() || 'Unknown',
            time: props.urlpubtimedate || props.date || new Date().toISOString(),
            source: 'GDELT',
            source_tier: 'curated_dataset',
            verification: 'unverified',
            fatalities: 0,
            url: props.url || '',
          });
        }
      });
    }
  } catch (e) {
    console.error('GDELT GEO error:', e);
  }

  // Also try GDELT DOC API as backup
  try {
    const res = await fetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=conflict%20OR%20attack%20OR%20bombing&mode=artlist&maxrecords=25&format=json&timespan=24h',
      { next: { revalidate: 300 } }
    );
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.articles) {
        data.articles.forEach((a: any, i: number) => {
          if (a.title) {
            events.push({
              id: 'gdelt_doc_' + i + '_' + Date.now(),
              type: guessType(a.title),
              headline: a.title.slice(0, 140),
              lat: 0,
              lon: 0,
              locality: a.sourcecountry || 'Unknown',
              country: a.sourcecountry || 'Unknown',
              time: a.seendate ? formatGdeltDate(a.seendate) : new Date().toISOString(),
              source: 'GDELT',
              source_tier: 'curated_dataset',
              verification: 'unverified',
              fatalities: 0,
              url: a.url || '',
            });
          }
        });
      }
    } catch {}
  } catch (e) {
    console.error('GDELT DOC error:', e);
  }

  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({
    events,
    total: events.length,
    generated_at: new Date().toISOString(),
  });
}

function guessType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('strike') || t.includes('airstrike') || t.includes('drone')) return 'strike';
  if (t.includes('battle') || t.includes('clash') || t.includes('fighting')) return 'battle';
  if (t.includes('explo') || t.includes('bomb') || t.includes('blast') || t.includes('shell')) return 'explosion_remote_violence';
  if (t.includes('shoot') || t.includes('gunfire') || t.includes('mass shoot')) return 'mass_shooting';
  if (t.includes('terror') || t.includes('suicide')) return 'terror_attack';
  if (t.includes('protest') || t.includes('demonstrat') || t.includes('rally')) return 'protest';
  if (t.includes('civilian') || t.includes('massacre') || t.includes('killed')) return 'violence_against_civilians';
  if (t.includes('attack')) return 'battle';
  return 'strategic_development';
}

function formatGdeltDate(d: string): string {
  try {
    if (d.length >= 8) {
      return d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8) + 'T' +
        (d.slice(9,11)||'00') + ':' + (d.slice(11,13)||'00') + ':00Z';
    }
  } catch {}
  return new Date().toISOString();
}
