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
const FALLBACK: Item[] = [
  { title: 'The ozone layer is healing', summary: 'After the world agreed to phase out CFCs, the ozone layer is on track to fully recover within decades — the hole over Antarctica is measurably shrinking.', source: 'UN Environment' },
  { title: 'Child mortality has more than halved', summary: 'Since 1990, the number of children who die before their fifth birthday has fallen by more than half worldwide — millions of lives saved every year through vaccines, clean water and better care.', source: 'UNICEF' },
  { title: 'Giving makes us happier than getting', summary: 'Studies find that spending money on other people lifts your own happiness more than spending it on yourself — generosity, it turns out, is a reliable route to feeling good.', source: 'Greater Good' },
  { title: 'The “helper’s high” is real', summary: 'A single act of kindness gives the brain a genuine chemical lift. Small, everyday kindness measurably lowers stress — for the giver as much as the receiver.', source: 'Greater Good' },
  { title: 'Guinea worm is nearly gone', summary: 'A disease that once caused millions of cases a year is down to just a handful — one of the great quiet public-health victories, achieved without a vaccine, through patience and community effort.', source: 'The Carter Center' },
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

interface Item {
  title: string;
  summary: string;
  source: string;
}

// Turn a feed's <description>/<content> excerpt into a clean, complete little
// summary — the publisher's own words, minus the RSS cruft. Keep 1–3 sentences.
function toSummary(raw: string): string {
  let s = decode(raw)
    // WordPress feed footer + "read more" artefacts.
    .replace(/The post .*? appeared first on .*?\.?$/s, '')
    .replace(/\[[…\.]+\]/g, '')
    .replace(/(Continue reading|Read more|Read the full story).*$/is, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= 300) return s;
  // Trim to a sentence boundary near ~280 chars so nothing is mid-word.
  const cut = s.slice(0, 300);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return (lastStop > 120 ? cut.slice(0, lastStop + 1) : cut.trim() + '…').trim();
}

async function fetchFeed(url: string, source: string): Promise<Item[]> {
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
    const out: Item[] = [];
    for (const it of items.slice(0, 8)) {
      const tm = it.match(/<title>([\s\S]*?)<\/title>/);
      if (!tm) continue;
      const title = decode(tm[1]);
      const dm =
        it.match(/<description>([\s\S]*?)<\/description>/) ||
        it.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
      const summary = dm ? toSummary(dm[1]) : '';
      // Need a title and a real summary the reader can actually understand.
      if (title.length >= 12 && summary.length >= 40) {
        out.push({ title, summary, source });
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
    const merged: Item[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      for (const list of lists) {
        const item = list[i];
        if (item && !seen.has(item.title.toLowerCase())) {
          seen.add(item.title.toLowerCase());
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
