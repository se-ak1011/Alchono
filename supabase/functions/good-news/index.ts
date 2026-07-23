import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * "A little good news" — a small window of warmth on Home.
 *
 * We only ever pull from sources that are ENTIRELY curated-positive, so there's
 * nothing dark to filter out, and we NEVER invent a headline. The mix is
 * deliberate: human-kindness + the science/psychology of wellbeing.
 *
 * Edit FEEDS to retune the tone. Each feed is fetched independently with a
 * timeout; any that fail are skipped, and a small evergreen fallback ensures
 * the band is never empty. Only the headline + source name leave here — no
 * links, no article bodies.
 */
const FEEDS: { url: string; source: string }[] = [
  // Human kindness / everyday good
  { url: 'https://www.goodnewsnetwork.org/feed/', source: 'Good News Network' },
  { url: 'https://www.positive.news/feed/', source: 'Positive News' },
  // Science & psychology of a kinder life (Berkeley's Greater Good)
  { url: 'https://greatergood.berkeley.edu/feed', source: 'Greater Good' },
  // Positive science/climate/health
  { url: 'https://www.goodnewsnetwork.org/category/news/science/feed/', source: 'Good News Network' },
];

// Real, evergreen, verifiable — only shown if every live feed is unreachable.
const FALLBACK: { headline: string; source: string }[] = [
  { headline: 'The ozone layer is on track to fully heal within decades — the hole is shrinking.', source: 'UN Environment' },
  { headline: 'Global child mortality has more than halved since 1990.', source: 'UNICEF' },
  { headline: 'Spending on other people boosts your own happiness more than spending on yourself.', source: 'Greater Good' },
  { headline: 'Guinea worm disease has gone from millions of cases a year to just a handful.', source: 'The Carter Center' },
  { headline: 'A single act of kindness gives the brain a genuine lift — the “helper’s high” is real.', source: 'Greater Good' },
  { headline: 'More than half the world now uses the internet to stay connected to the people they love.', source: 'ITU' },
];

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8216;|&#x2018;/g, '‘')
    .replace(/&#8220;|&#8221;/g, '“')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;|&#8212;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

async function fetchFeed(url: string, source: string): Promise<{ headline: string; source: string }[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Alchono/1.0 (good-news)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
    const out: { headline: string; source: string }[] = [];
    for (const it of items.slice(0, 8)) {
      const m = it.match(/<title>([\s\S]*?)<\/title>/);
      if (!m) continue;
      const headline = decode(m[1]);
      // Skip empties and over-long titles that won't sit on the band.
      if (headline.length >= 12 && headline.length <= 140) {
        out.push({ headline, source });
      }
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const lists = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.source)));

    // Round-robin interleave so the mix never clumps into one source in a row.
    const merged: { headline: string; source: string }[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      for (const list of lists) {
        const item = list[i];
        if (item && !seen.has(item.headline.toLowerCase())) {
          seen.add(item.headline.toLowerCase());
          merged.push(item);
        }
      }
    }

    const items = merged.length > 0 ? merged.slice(0, 24) : FALLBACK;
    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[good-news] FAILED', error);
    return new Response(JSON.stringify({ items: FALLBACK }), {
      status: 200, // still give the app something warm
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
