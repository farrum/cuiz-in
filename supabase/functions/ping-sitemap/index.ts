import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITEMAP_URL = 'https://cuiz.in/sitemap.xml'

// Search engine ping URLs
const PING_URLS = [
  `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
]

async function pingSitemapToSearchEngines(): Promise<{ google: boolean; bing: boolean }> {
  const results = { google: false, bing: false }
  
  try {
    // Ping Google
    const googleResponse = await fetch(PING_URLS[0], { method: 'GET' })
    results.google = googleResponse.ok
    console.log(`Google ping: ${googleResponse.status} - ${results.google ? 'Success' : 'Failed'}`)
  } catch (error) {
    console.error('Google ping error:', error)
  }
  
  try {
    // Ping Bing
    const bingResponse = await fetch(PING_URLS[1], { method: 'GET' })
    results.bing = bingResponse.ok
    console.log(`Bing ping: ${bingResponse.status} - ${results.bing ? 'Success' : 'Failed'}`)
  } catch (error) {
    console.error('Bing ping error:', error)
  }
  
  return results
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Sitemap ping triggered at:', new Date().toISOString())
    
    // Get the reason for ping from request body (optional)
    let reason = 'manual'
    try {
      const body = await req.json()
      reason = body.reason || 'manual'
    } catch {
      // No body or invalid JSON, use default reason
    }
    
    console.log(`Ping reason: ${reason}`)
    
    // Ping search engines
    const pingResults = await pingSitemapToSearchEngines()
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      reason,
      results: {
        google: pingResults.google ? 'pinged' : 'failed',
        bing: pingResults.bing ? 'pinged' : 'failed',
      },
      sitemapUrl: SITEMAP_URL,
    }
    
    console.log('Ping results:', JSON.stringify(response))
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in ping-sitemap function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
