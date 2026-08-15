import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith('sc-domain:')) {
    const domain = siteUrl.slice('sc-domain:'.length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    const prefix = new URL(siteUrl);
    return target.href.startsWith(prefix.href);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    // ---- Admin authorization ----
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let adminUserId: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await supabaseAuth.auth.getUser();
      if (data?.user) adminUserId = data.user.id;
    }
    if (!adminUserId) {
      return json({ error: 'Unauthorized: No valid session' }, 401);
    }
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!adminRole) {
      return json({ error: 'Unauthorized: Admin access required' }, 403);
    }

    // ---- Connector credentials ----
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const connectionApiKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
    if (!lovableApiKey || !connectionApiKey) {
      return json({ error: 'Search Console connection is not configured' }, 503);
    }
    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': connectionApiKey,
    };

    async function listVerifiedSites(): Promise<SiteEntry[]> {
      const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
      if (!res.ok) {
        const text = await res.text();
        console.error(`Gateway /sites failed [${res.status}]: ${text}`);
        throw new Error(`[${res.status}]: ${text}`);
      }
      const payload = (await res.json()) as { siteEntry?: SiteEntry[] };
      return (payload.siteEntry ?? []).filter(
        (e) => e.permissionLevel !== 'siteUnverifiedUser'
      );
    }

    // ---- Actions ----
    if (action === 'list_sites') {
      const sites = await listVerifiedSites();
      const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl : null;
      let matches = sites;
      if (targetUrl) {
        try {
          const target = new URL(targetUrl);
          const filtered = sites.filter((s) => coversTarget(s.siteUrl, target));
          if (filtered.length > 0) matches = filtered;
        } catch {
          // ignore invalid target, return all verified sites
        }
      }
      return json({ sites, matches });
    }

    // Every remaining action is per-site: validate the selection first.
    const selected = typeof body.siteUrl === 'string' ? body.siteUrl : '';
    if (!selected) return json({ error: 'siteUrl is required' }, 400);
    const sites = await listVerifiedSites();
    if (!sites.some((s) => s.siteUrl === selected)) {
      return json(
        { error: 'The selected Search Console property is not verified for this account' },
        403
      );
    }

    if (action === 'query') {
      const query = {
        startDate: body.startDate,
        endDate: body.endDate,
        dimensions: Array.isArray(body.dimensions) ? body.dimensions : undefined,
        rowLimit: typeof body.rowLimit === 'number' ? Math.min(body.rowLimit, 500) : 25,
        dimensionFilterGroups: body.dimensionFilterGroups,
        type: body.searchType,
      };
      if (!query.startDate || !query.endDate) {
        return json({ error: 'startDate and endDate are required' }, 400);
      }
      const res = await fetch(
        `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(selected)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(query),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        console.error(`Search Console query failed [${res.status}]: ${text}`);
        return json({ error: 'Search Console query failed', status: res.status, details: text }, res.status);
      }
      const data = await res.json();
      return json({ rows: data.rows ?? [] });
    }

    if (action === 'sitemaps') {
      const res = await fetch(
        `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(selected)}/sitemaps`,
        { headers }
      );
      if (!res.ok) {
        const text = await res.text();
        console.error(`Sitemap list failed [${res.status}]: ${text}`);
        return json({ error: 'Sitemap list failed', status: res.status, details: text }, res.status);
      }
      const data = await res.json();
      return json({ sitemaps: data.sitemap ?? [] });
    }

    if (action === 'inspect') {
      const inspectionUrl = typeof body.inspectionUrl === 'string' ? body.inspectionUrl : '';
      if (!inspectionUrl) return json({ error: 'inspectionUrl is required' }, 400);
      const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl, siteUrl: selected }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`URL inspection failed [${res.status}]: ${text}`);
        return json({ error: 'URL inspection failed', status: res.status, details: text }, res.status);
      }
      return json(await res.json());
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('search-console error:', error);
    return json({ error: (error as Error).message ?? 'Unexpected error' }, 500);
  }
});