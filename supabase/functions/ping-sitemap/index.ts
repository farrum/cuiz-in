const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform',
}

const SITEMAP_URL = 'https://cuiz.in/sitemap.xml'
const SITE_HOST = 'cuiz.in'

// IndexNow is the modern replacement for sitemap pinging
// Supported by Bing, Yandex, Seznam, Naver, and Yep
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
]

// Note: Google deprecated the ping API in 2023
// Google now relies on sitemaps + Search Console API
// For Google, the sitemap auto-discovery via robots.txt is sufficient

async function pingIndexNow(urls: string[]): Promise<{ endpoint: string; success: boolean; status: number }[]> {
  const results: { endpoint: string; success: boolean; status: number }[] = []
  
  // IndexNow requires a key - we'll use a simple hash of the domain
  // In production, you'd generate a proper key and host it at /indexnow-key.txt
  const key = 'cuizin-indexnow-key-2024'
  
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: SITE_HOST,
          key: key,
          keyLocation: `https://${SITE_HOST}/${key}.txt`,
          urlList: urls,
        }),
      })
      
      results.push({
        endpoint,
        success: response.status === 200 || response.status === 202,
        status: response.status,
      })
      
      console.log(`IndexNow ${endpoint}: ${response.status}`)
    } catch (error) {
      console.error(`IndexNow ${endpoint} error:`, error)
      results.push({ endpoint, success: false, status: 0 })
    }
  }
  
  return results
}

async function notifySearchEngines(): Promise<{
  indexNow: { endpoint: string; success: boolean; status: number }[];
  legacyPing: { google: boolean; bing: boolean };
}> {
  // URLs to notify about (sitemap location)
  const urls = [SITEMAP_URL, `https://${SITE_HOST}/`]
  
  // Try IndexNow (modern approach)
  const indexNowResults = await pingIndexNow(urls)
  
  // Also try legacy ping as fallback (may not work)
  const legacyResults = { google: false, bing: false }
  
  try {
    const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
    const googleRes = await fetch(googleUrl)
    legacyResults.google = googleRes.ok
    console.log(`Legacy Google ping: ${googleRes.status}`)
  } catch (e) {
    console.log('Legacy Google ping failed')
  }
  
  try {
    const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
    const bingRes = await fetch(bingUrl)
    legacyResults.bing = bingRes.ok
    console.log(`Legacy Bing ping: ${bingRes.status}`)
  } catch (e) {
    console.log('Legacy Bing ping failed')
  }
  
  return { indexNow: indexNowResults, legacyPing: legacyResults }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Sitemap ping triggered at:', new Date().toISOString())
    
    let reason = 'manual'
    try {
      const body = await req.json()
      reason = body.reason || 'manual'
    } catch {
      // No body or invalid JSON
    }
    
    console.log(`Ping reason: ${reason}`)
    
    const results = await notifySearchEngines()
    
    const anyIndexNowSuccess = results.indexNow.some(r => r.success)
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      reason,
      sitemapUrl: SITEMAP_URL,
      indexNow: {
        attempted: results.indexNow.length,
        successful: results.indexNow.filter(r => r.success).length,
        details: results.indexNow,
        note: anyIndexNowSuccess 
          ? 'IndexNow notifications sent successfully' 
          : 'IndexNow requires a key file hosted at /cuizin-indexnow-key-2024.txt'
      },
      legacyPing: {
        google: results.legacyPing.google ? 'success' : 'deprecated/failed',
        bing: results.legacyPing.bing ? 'success' : 'failed',
        note: 'Legacy ping APIs are deprecated. IndexNow is the modern replacement.'
      }
    }
    
    console.log('Results:', JSON.stringify(response))
    
    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
