// VAST proxy: desktop browsers send a desktop User-Agent, and the yomeno ad
// network returns an empty <VAST/> for those. This function fetches the tag
// with a MOBILE User-Agent (which fills with video), follows wrapper
// redirects server-side, and returns the resolved media/click/impression URLs
// as JSON so the desktop client can play the video directly.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

const DEFAULT_VAST = "https://vast.yomeno.xyz/vast?spot_id=1494657";
const MAX_WRAPPERS = 6;

// Strict allowlist of permitted ad-network hosts. Only https:// URLs whose
// hostname matches one of these suffixes may be fetched server-side. This
// prevents SSRF against cloud metadata endpoints and internal services.
const ALLOWED_HOST_SUFFIXES = [
  "yomeno.xyz",
  "doubleclick.net",
  "googlesyndication.com",
  "google.com",
  "adnxs.com",
  "springserve.com",
  "spotxchange.com",
  "spotx.tv",
];

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv6 loopback / link-local / unique-local
  if (h === "::1" || h.startsWith("fe80") || h.startsWith("fc") || h.startsWith("fd")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function isAllowedUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (isPrivateHost(host)) return false;
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

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

  // SSRF guard: only fetch allowlisted https hosts, including wrapper redirects.
  if (!isAllowedUrl(url)) {
    throw new Error("Blocked: URL is not an allowed ad-network host");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": MOBILE_UA,
      Accept: "application/xml,text/xml,*/*",
    },
    redirect: "manual",
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

    // Reject any tagUrl that is not an allowlisted https ad-network host.
    if (!isAllowedUrl(tagUrl)) {
      return new Response(
        JSON.stringify({
          mediaUrl: null,
          clickUrl: null,
          impressions: [],
          error: "Blocked: tagUrl is not an allowed ad-network host",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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