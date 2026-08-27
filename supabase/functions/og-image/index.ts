import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title') || 'Quiz Question';
    const category = url.searchParams.get('category') || 'General';
    const difficulty = url.searchParams.get('difficulty') || 'medium';

    // Truncate title if too long
    const displayTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;
    
    // Category colors
    const categoryColors: Record<string, { bg: string; accent: string }> = {
      'history': { bg: '#8B4513', accent: '#D2691E' },
      'science': { bg: '#228B22', accent: '#32CD32' },
      'geography': { bg: '#4169E1', accent: '#87CEEB' },
      'literature': { bg: '#9932CC', accent: '#DA70D6' },
      'entertainment': { bg: '#FF1493', accent: '#FFB6C1' },
      'sports': { bg: '#FF4500', accent: '#FF6347' },
      'technology': { bg: '#00CED1', accent: '#48D1CC' },
      'general-knowledge': { bg: '#FFD700', accent: '#FFA500' },
    };

    const colors = categoryColors[category.toLowerCase()] || { bg: '#6366f1', accent: '#818cf8' };
    
    // Difficulty badge colors
    const difficultyColors: Record<string, string> = {
      'easy': '#22c55e',
      'medium': '#3b82f6',
      'hard': '#ef4444',
    };
    
    const difficultyColor = difficultyColors[difficulty.toLowerCase()] || '#3b82f6';

    // Generate SVG
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative elements -->
  <circle cx="1100" cy="100" r="200" fill="url(#accent)" opacity="0.5"/>
  <circle cx="100" cy="530" r="150" fill="url(#accent)" opacity="0.3"/>
  
  <!-- Pattern -->
  <g opacity="0.05">
    ${Array.from({length: 12}, (_, i) => 
      Array.from({length: 7}, (_, j) => 
        `<circle cx="${100 + i * 100}" cy="${90 + j * 90}" r="4" fill="white"/>`
      ).join('')
    ).join('')}
  </g>
  
  <!-- Logo/Brand -->
  <g transform="translate(60, 50)">
    <rect x="0" y="0" width="140" height="50" rx="25" fill="white" filter="url(#shadow)"/>
    <text x="70" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors.bg}">CuizIN</text>
  </g>
  
  <!-- Category badge -->
  <g transform="translate(60, 130)">
    <rect x="0" y="0" width="${Math.max(category.length * 12 + 40, 120)}" height="40" rx="20" fill="${colors.accent}" opacity="0.9"/>
    <text x="${Math.max(category.length * 6 + 20, 60)}" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="white">${escapeXml(category.charAt(0).toUpperCase() + category.slice(1))}</text>
  </g>
  
  <!-- Difficulty badge -->
  <g transform="translate(${Math.max(category.length * 12 + 110, 190)}, 130)">
    <rect x="0" y="0" width="100" height="40" rx="20" fill="${difficultyColor}"/>
    <text x="50" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="white">${escapeXml(difficulty.charAt(0).toUpperCase() + difficulty.slice(1))}</text>
  </g>
  
  <!-- Question mark icon -->
  <g transform="translate(1050, 450)">
    <circle cx="50" cy="50" r="60" fill="white" opacity="0.1"/>
    <text x="50" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" opacity="0.3">?</text>
  </g>
  
  <!-- Main title -->
  <foreignObject x="60" y="200" width="1080" height="280">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 42px; font-weight: bold; color: white; line-height: 1.3; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
      ${escapeXml(displayTitle)}
    </div>
  </foreignObject>
  
  <!-- Call to action -->
  <g transform="translate(60, 520)">
    <rect x="0" y="0" width="280" height="60" rx="30" fill="white" filter="url(#shadow)"/>
    <text x="140" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors.bg}">▶ Play &amp; Earn Points</text>
  </g>
  
  <!-- Website URL -->
  <text x="1140" y="590" text-anchor="end" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.7">cuiz.in</text>
</svg>`;

    // Convert SVG to PNG using resvg-wasm would be ideal, but for now return SVG
    // Browsers and social platforms can render SVG OG images
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
