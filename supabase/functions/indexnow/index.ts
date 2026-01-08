import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const INDEXNOW_KEY = 'cuizin-indexnow-key-2024';
const SITE_URL = 'https://cuiz.in';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

// IndexNow API endpoints for different search engines
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

interface IndexNowRequest {
  urls: string[];
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: IndexNowRequest = await req.json();
    const urls = body.urls || [];
    const reason = body.reason || 'manual';

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No URLs provided' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Limit to 10,000 URLs per request (IndexNow limit)
    const urlsToSubmit = urls.slice(0, 10000);

    console.log(`IndexNow: Submitting ${urlsToSubmit.length} URLs (reason: ${reason})`);

    const payload = {
      host: 'cuiz.in',
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urlsToSubmit
    };

    // Submit to all IndexNow endpoints in parallel
    const results = await Promise.allSettled(
      INDEXNOW_ENDPOINTS.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        
        return {
          endpoint,
          status: response.status,
          statusText: response.statusText,
        };
      })
    );

    const successfulSubmissions = results.filter(
      (r) => r.status === 'fulfilled' && (r.value.status === 200 || r.value.status === 202)
    ).length;

    const allResults = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return {
          endpoint: INDEXNOW_ENDPOINTS[i],
          success: r.value.status === 200 || r.value.status === 202,
          status: r.value.status,
          message: r.value.statusText,
        };
      }
      return {
        endpoint: INDEXNOW_ENDPOINTS[i],
        success: false,
        status: 0,
        message: r.reason?.message || 'Unknown error',
      };
    });

    console.log(`IndexNow: Successfully submitted to ${successfulSubmissions}/${INDEXNOW_ENDPOINTS.length} endpoints`);
    console.log('Results:', JSON.stringify(allResults));

    return new Response(
      JSON.stringify({
        success: successfulSubmissions > 0,
        urlsSubmitted: urlsToSubmit.length,
        endpoints: allResults,
        reason,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('IndexNow error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit to IndexNow', details: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
