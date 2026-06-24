// VAST proxy: desktop browsers send a desktop User-Agent, and the yomeno ad
// network returns an empty <VAST/> for those. This function fetches the tag
// with a MOBILE User-Agent (which fills with video), follows wrapper
// redirects server-side, and returns the resolved media/click/impression URLs
// as JSON so the desktop client can play the video directly.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

const DEFAULT_VAST = "https://vast.yomeno.xyz/vast?spot_id=1494657";
const MAX_WRAPPERS = 6;

function cdata(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim() || null;
}

function firstTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? cdata(m[1]) : null;
}

function allTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const v = cdata(m[1]);
    if (v) out.push(v);
  }
  return out;
}

function extractUrl(raw: string): string | null {
  const m = raw.match(/https?:\/\/[^\s"'<>\]]+/i);
  return m ? m[0] : null;
}

function pickMediaFile(xml: string): string | null {
  const re = /<MediaFile([^>]*)>([\s\S]*?)<\/MediaFile>/gi;
  const candidates: { url: string; type: string; width: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1] || "";
    const url = extractUrl(cdata(m[2]) || "");
    if (!url) continue;
    const typeMatch = attrs.match(/type=["']([^"']+)["']/i);
    const widthMatch = attrs.match(/width=["'](\d+)["']/i);
    candidates.push({
      url,
      type: (typeMatch?.[1] || "").toLowerCase(),
      width: Number(widthMatch?.[1] || 0),
    });
  }
  if (candidates.length === 0) return null;
  const mp4 = candidates.filter((c) => c.type.includes("mp4"));
  const pool = mp4.length > 0 ? mp4 : candidates;
  pool.sort((a, b) => b.width - a.width);
  return pool[0].url;
}

async function resolve(
  url: string,
  depth: number,
  impressions: string[],
): Promise<{ mediaUrl: string | null; clickUrl: string | null }> {
  if (depth > MAX_WRAPPERS) return { mediaUrl: null, clickUrl: null };

  const res = await fetch(url, {
    headers: {
      "User-Agent": MOBILE_UA,
      Accept: "application/xml,text/xml,*/*",
    },
  });
  if (!res.ok) throw new Error(`vast http ${res.status}`);
  const xml = await res.text();

  for (const imp of allTags(xml, "Impression")) impressions.push(imp);

  const wrapper = firstTag(xml, "VASTAdTagURI");
  if (wrapper) return resolve(wrapper, depth + 1, impressions);

  const mediaUrl = pickMediaFile(xml);
  const clickUrl = firstTag(xml, "ClickThrough");
  return { mediaUrl, clickUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let tagUrl = url.searchParams.get("tagUrl");
    if (!tagUrl && req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.tagUrl) tagUrl = String(body.tagUrl);
      } catch {
        /* no/invalid body */
      }
    }
    if (!tagUrl) tagUrl = DEFAULT_VAST;

    // Always add a cache-buster + size hints so the network serves fresh
    // inventory instead of an empty dedupe response.
    const sep = tagUrl.includes("?") ? "&" : "?";
    tagUrl = `${tagUrl}${sep}cb=${Date.now()}${Math.floor(
      Math.random() * 1e6,
    )}&width=300&height=250`;

    const impressions: string[] = [];
    const { mediaUrl, clickUrl } = await resolve(tagUrl, 0, impressions);

    return new Response(
      JSON.stringify({ mediaUrl, clickUrl, impressions }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        mediaUrl: null,
        clickUrl: null,
        impressions: [],
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});