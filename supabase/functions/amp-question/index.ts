declare const Deno: any;
// @ts-ignore: Deno specific URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://cuiz.in';

// Create URL-friendly slug from question text
function createSlug(text: string, maxLength: number = 80): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .substring(0, maxLength)
    .replace(/-+$/, '');
}

// Get difficulty color for AMP styling
function getDifficultyColor(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return '#22c55e';
    case 'medium': return '#f59e0b';
    case 'hard': return '#ef4444';
    default: return '#6366f1';
  }
}

// Generate AMP-valid HTML for a quiz question
function generateAMPPage(question: any): string {
  const slug = createSlug(question.question);
  const canonicalUrl = `${SITE_URL}/quiz/question/${question.id}/${slug}`;
  const ampUrl = `${SITE_URL}/amp/question/${question.id}`;
  const difficultyColor = getDifficultyColor(question.difficulty);
  
  // Parse options safely
  let options: string[] = [];
  try {
    options = typeof question.options === 'string' 
      ? JSON.parse(question.options) 
      : question.options;
  } catch {
    options = [];
  }

  // Escape HTML entities
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const questionText = escapeHtml(question.question);
  const categoryText = escapeHtml(question.category || 'General Knowledge');
  const difficultyText = escapeHtml(question.difficulty || 'Medium');
  const explanationText = question.explanation ? escapeHtml(question.explanation) : null;
  const correctAnswer = escapeHtml(question.correct_answer);

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": questionText,
    "description": `Test your knowledge: ${questionText}`,
    "educationalLevel": difficultyText,
    "about": {
      "@type": "Thing",
      "name": categoryText
    },
    "hasPart": {
      "@type": "Question",
      "text": questionText,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": correctAnswer
      },
      "suggestedAnswer": options.map(opt => ({
        "@type": "Answer",
        "text": escapeHtml(opt)
      }))
    }
  };

  return `<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>${questionText} | CuizIN Quiz</title>
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="Quiz question: ${questionText.substring(0, 150)}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${questionText}">
  <meta property="og:description" content="Test your ${categoryText} knowledge with this ${difficultyText.toLowerCase()} quiz question!">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CuizIN">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${questionText}">
  <meta name="twitter:description" content="Test your ${categoryText} knowledge!">
  
  <!-- AMP Boilerplate -->
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  
  <!-- Custom AMP Styles -->
  <style amp-custom>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 16px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
      margin-bottom: 20px;
    }
    .card-header {
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    .badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-category {
      background: #e0e7ff;
      color: #4338ca;
    }
    .badge-difficulty {
      background: ${difficultyColor}20;
      color: ${difficultyColor};
    }
    .question {
      padding: 24px;
    }
    .question h1 {
      font-size: 22px;
      line-height: 1.4;
      color: #1e293b;
      margin: 0 0 24px 0;
    }
    .options {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .option {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      font-size: 16px;
      color: #334155;
      transition: all 0.2s;
    }
    .option:hover {
      border-color: #6366f1;
      background: #eef2ff;
    }
    .option.correct {
      background: #dcfce7;
      border-color: #22c55e;
      color: #166534;
    }
    .answer-section {
      background: #f0fdf4;
      padding: 20px;
      border-top: 2px solid #22c55e;
    }
    .answer-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #15803d;
      margin-bottom: 8px;
    }
    .answer-text {
      font-size: 18px;
      font-weight: 600;
      color: #166534;
    }
    .explanation {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #bbf7d0;
    }
    .explanation-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #166534;
      margin-bottom: 8px;
    }
    .explanation-text {
      font-size: 15px;
      line-height: 1.6;
      color: #15803d;
    }
    .cta {
      text-align: center;
      padding: 24px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .cta h2 {
      font-size: 20px;
      color: #1e293b;
      margin: 0 0 12px 0;
    }
    .cta p {
      color: #64748b;
      margin: 0 0 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #fff;
      padding: 14px 32px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding: 30px 0;
      color: rgba(255,255,255,0.8);
      font-size: 14px;
    }
    .footer a {
      color: #fff;
      text-decoration: none;
    }
  </style>
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData)}
  </script>
</head>
<body>
  <div class="container">
    <header class="header">
      <a href="${SITE_URL}" class="logo">🎯 CuizIN</a>
    </header>
    
    <article class="card">
      <div class="card-header">
        <div class="badges">
          <span class="badge badge-category">${categoryText}</span>
          <span class="badge badge-difficulty">${difficultyText}</span>
        </div>
      </div>
      
      <div class="question">
        <h1>${questionText}</h1>
        
        <ul class="options">
          ${options.map((opt, i) => {
            const isCorrect = opt === question.correct_answer;
            return `<li class="option${isCorrect ? ' correct' : ''}">${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}</li>`;
          }).join('\n          ')}
        </ul>
      </div>
      
      <div class="answer-section">
        <div class="answer-label">✓ Correct Answer</div>
        <div class="answer-text">${correctAnswer}</div>
        ${explanationText ? `
        <div class="explanation">
          <div class="explanation-label">📚 Explanation</div>
          <div class="explanation-text">${explanationText}</div>
        </div>
        ` : ''}
      </div>
    </article>
    
    <div class="cta">
      <h2>Want more quiz questions?</h2>
      <p>Play unlimited quizzes and earn points!</p>
      <a href="${SITE_URL}/quiz" class="cta-button">Play Quiz Now →</a>
    </div>
    
    <footer class="footer">
      <p>© 2025 <a href="${SITE_URL}">CuizIN</a> - India's #1 Quiz Platform</p>
      <p><a href="${canonicalUrl}">View full version</a></p>
    </footer>
  </div>
</body>
</html>`;
}

// Generate 404 AMP page
function generate404Page(): string {
  return `<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>Question Not Found | CuizIN</title>
  <link rel="canonical" href="${SITE_URL}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
    h1 { color: #1e293b; }
    a { color: #6366f1; }
  </style>
</head>
<body>
  <h1>Question Not Found</h1>
  <p>This quiz question doesn't exist or has been removed.</p>
  <p><a href="${SITE_URL}/quiz">Browse all quizzes →</a></p>
</body>
</html>`;
}

Deno.serve(async (req: any) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Path structure: /functions/v1/amp-question/{questionId}
    // parts[0]=functions, parts[1]=v1, parts[2]=amp-question, parts[3]=questionId
    const questionId = url.searchParams.get('id') || pathParts[3] || pathParts[pathParts.length - 1];
    
    if (!questionId || questionId === 'amp-question' || questionId === 'v1') {
      console.error('Invalid or missing Question ID in path:', url.pathname);
      return new Response(generate404Page(), {
        status: 404,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch question from database
    const { data: question, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error || !question) {
      console.log('Question not found:', questionId);
      return new Response(generate404Page(), {
        status: 404,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Generate and return AMP HTML
    const ampHtml = generateAMPPage(question);
    
    return new Response(ampHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'AMP-Access-Control-Allow-Source-Origin': SITE_URL,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('AMP generation error:', error);
    return new Response(generate404Page(), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});
