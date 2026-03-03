import { NextResponse } from 'next/server';

export async function GET() {
  const events: any[] = [];

  // ACLED - real conflict data
  try {
    const key = process.env.ACLED_API_KEY;
    const email = process.env.ACLED_EMAIL;
    if (key && email) {
      const res = await fetch(
        `https://api.acleddata.com/acled/read?key=${key}&email=${email}&limit=50` +
        `&fields=event_id_cnty|event_date|event_type|sub_event_type|country|admin1|location|latitude|longitude|fatalities|source|notes`,
        { next: { revalidate: 600 } }
      );
      const data = await res.json();
      if (data.data) {
        data.data.forEach((e: any) => {
          const typeMap: Record<string, string> = {
            'Battles': 'battle',
            'Explosions/Remote violence': 'explosion_remote_violence',
            'Violence against civilians': 'violence_against_civilians',
            'Protests': 'protest',
            'Riots': 'protest',
            'Strategic developments': 'strategic_development',
          };
          events.push({
            id: 'acled_' + e.event_id_cnty,
            type: typeMap[e.event_type] || 'strategic_development',
            headline: (e.notes || `${e.event_type} in ${e.location}`).slice(0, 140),
            lat: parseFloat(e.latitude),
            lon: parseFloat(e.longitude),
            locality: e.location || e.admin1,
            country: e.country,
            time: e.event_date + 'T00:00:00Z',
            source: 'ACLED',
            source_tier: 'curated_dataset',
            verification: 'corroborated',
            fatalities: parseInt(e.fatalities) || 0,
          });
        });
      }
    }
  } catch (e) { console.error('ACLED:', e); }

  // GDELT - global news events
  try {
    const res = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?` +
      `query=conflict OR attack OR bombing OR shooting&mode=artlist&maxrecords=30&format=json&sort=datedesc`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    if (data.articles) {
      data.articles.forEach((a: any, i: number) => {
        if (a.title) {
          events.push({
            id: 'gdelt_' + i + '_' + Date.now(),
            type: 'strategic_development',
            headline: a.title.slice(0, 140),
            lat: a.sourcelat ? parseFloat(a.sourcelat) : 0,
            lon: a.sourcelon ? parseFloat(a.sourcelon) : 0,
            locality: a.sourcecountry || 'Unknown',
            country: a.sourcecountry || 'Unknown',
            time: a.seendate ? `${a.seendate.slice(0,4)}-${a.seendate.slice(4,6)}-${a.seendate.slice(6,8)}T00:00:00Z` : new Date().toISOString(),
            source: 'GDELT',
            source_tier: 'curated_dataset',
            verification: 'unverified',
            fatalities: 0,
            url: a.url,
          });
        }
      });
    }
  } catch (e) { console.error('GDELT:', e); }

  // ReliefWeb - UN humanitarian data
  try {
    const res = await fetch(
      `https://api.reliefweb.int/v1/reports?appname=sentinel-monitor&limit=20&preset=latest` +
      `&fields[include][]=title&fields[include][]=date.created&fields[include][]=country.name` +
      `&fields[include][]=primary_country.location&fields[include][]=source.name`,
      { next: { revalidate: 120 } }
    );
    const data = await res.json();
    if (data.data) {
      data.data.forEach((r: any) => {
        const loc = r.fields?.primary_country?.location;
        events.push({
          id: 'rw_' + r.id,
          type: 'strategic_development',
          headline: (r.fields?.title || 'ReliefWeb Report').slice(0, 140),
          lat: loc?.lat || 0,
          lon: loc?.lon || 0,
          locality: r.fields?.country?.[0]?.name || 'Unknown',
          country: r.fields?.country?.[0]?.name || 'Unknown',
          time: r.fields?.date?.created || new Date().toISOString(),
          source: 'ReliefWeb',
          source_tier: 'official',
          verification: 'official_confirmed',
          fatalities: 0,
        });
      });
    }
  } catch (e) { console.error('ReliefWeb:', e); }

  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({
    events,
    total: events.length,
    generated_at: new Date().toISOString(),
  });
}
