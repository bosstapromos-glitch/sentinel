import { NextResponse } from 'next/server';

const RSS_FEEDS = [
  { name: 'Liveuamap', url: 'https://liveuamap.com/rss' },
  { name: 'ReliefWeb Updates', url: 'https://reliefweb.int/updates/rss.xml' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' },
  { name: 'CENTCOM', url: 'https://www.centcom.mil/MEDIA/PRESS-RELEASES/RSS/' },
];

interface FeedItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  type: string;
}

function guessType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('strike') || t.includes('airstrike') || t.includes('drone')) return 'strike';
  if (t.includes('battle') || t.includes('clash') || t.includes('fighting')) return 'battle';
  if (t.includes('explo') || t.includes('bomb') || t.includes('blast')) return 'explosion';
  if (t.includes('shoot') || t.includes('gun')) return 'shooting';
  if (t.includes('terror')) return 'terror';
  if (t.includes('protest') || t.includes('demonstrat')) return 'protest';
  if (t.includes('killed') || t.includes('dead') || t.includes('casualt')) return 'casualties';
  if (t.includes('attack')) return 'attack';
  if (t.includes('missile') || t.includes('rocket')) return 'strike';
  return 'news';
}

function parseXML(xml: string, sourceName: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || 
                  block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

    if (title) {
      items.push({
        title: title.replace(/<[^>]*>/g, '').trim(),
        link,
        source: sourceName,
        pubDate: pubDate || new Date().toISOString(),
        type: guessType(title),
      });
    }
  }
  return items;
}

export async function GET() {
  const allItems: FeedItem[] = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          next: { revalidate: 300 },
          headers: { 'User-Agent': 'SENTINEL-Monitor/1.0' },
        });
        if (res.ok) {
          const xml = await res.text();
          const items = parseXML(xml, feed.name);
          allItems.push(...items);
        }
      } catch (e) {
        console.error(`RSS error for ${feed.name}:`, e);
      }
    })
  );

  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return NextResponse.json({
    items: allItems.slice(0, 100),
    total: allItems.length,
    sources: RSS_FEEDS.map(f => f.name),
    generated_at: new Date().toISOString(),
  });
}
