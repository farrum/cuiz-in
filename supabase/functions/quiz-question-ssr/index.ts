import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = 'https://pgywvtphfidouakypdno.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const SITE_URL = 'https://cuiz.in';
const SITE_NAME = 'Cuiz.in';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform',
};

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createSlug(text: string, maxLength: number = 80): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, maxLength)
    .replace(/-$/, '');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  category: string;
  difficulty: string | null;
  image_url: string | null;
  created_at: string | null;
}


const categoryToSlugMap: Record<string, string> = {
  'History': 'history',
  'Science': 'science',
  'Science & Nature': 'science',
  'Science &amp; Nature': 'science',
  'Nature': 'science',
  'Science: Computers': 'technology',
  'Science: Gadgets': 'technology',
  'Science: Mathematics': 'science',
  'Science and Technology': 'technology',
  'Science & Technology': 'technology',
  'Geography': 'geography',
  'Arts & Literature': 'literature',
  'Arts and Literature': 'literature',
  'Entertainment: Books': 'literature',
  'Entertainment': 'entertainment',
  'Entertainment: Video Games': 'entertainment',
  'Entertainment: Music': 'entertainment',
  'Entertainment: Film': 'entertainment',
  'Entertainment: Television': 'entertainment',
  'Entertainment: Board Games': 'entertainment',
  'Entertainment: Musicals &amp; Theatres': 'entertainment',
  'Entertainment: Japanese Anime &amp; Manga': 'entertainment',
  'Entertainment: Cartoon &amp; Animations': 'entertainment',
  'Entertainment: Comics': 'entertainment',
  'Celebrities': 'entertainment',
  'Art': 'entertainment',
  'Sports': 'sports',
  'Cricket': 'sports',
  'Vehicles': 'technology',
  'General Knowledge': 'general-knowledge',
  'Culture': 'general-knowledge',
  'Animals': 'general-knowledge',
  'Food & Drink': 'general-knowledge',
  'Food and Drinks': 'general-knowledge',
  'Mythology': 'general-knowledge',
  'Politics': 'global-politics',
  'Global Politics': 'global-politics',
  'Law': 'law-justice',
  'Law & Justice': 'law-justice',
  'Music': 'music',
  'Environment': 'environment-nature',
  'Environment & Nature': 'environment-nature',
  'Business': 'business-finance',
  'Business & Finance': 'business-finance',
  'Indian Mythology': 'indian-mythology',
  'Philosophy': 'philosophy',
  'Kids': 'kids-trivia',
  'Kids Corner': 'kids-trivia',
  'Guinness World Records': 'guinness-world-records',
  'K-Pop Music': 'k-pop-k-drama',
  'Korean Drama': 'k-pop-k-drama',
  'K-Pop & K-Drama': 'k-pop-k-drama',
};
function getCategorySlug(cat: string): string {
  return categoryToSlugMap[cat] || 'general-knowledge';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let questionId = url.searchParams.get('id');
    
    // Fallback: extract from path splat if query param is missing (due to CDN stripping on 200 proxies)
    if (!questionId) {
      const pathParts = url.pathname.split('/');
      const ssrIndex = pathParts.indexOf('quiz-question-ssr');
      if (ssrIndex !== -1 && pathParts[ssrIndex + 1]) {
        questionId = pathParts[ssrIndex + 1];
      }
    }
    
    if (!questionId) {
      console.error('No question ID provided in query or path');
      return new Response('Question ID required', { status: 400, headers: corsHeaders });
    }

    console.log(`SSR request for question: ${questionId}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch the question
    const { data: question, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();
    
    if (error || !question) {
      console.error('Question not found:', error);
      return new Response('Question not found', { status: 404, headers: corsHeaders });
    }

    const q = question as QuizQuestion;
    
    // Fetch related questions in the same category (crawl paths)
    const { data: related } = await supabase
      .from('quiz_questions')
      .select('id, question, category')
      .eq('category', q.category)
      .neq('id', q.id)
      .limit(6);

    const options = Array.isArray(q.options) ? q.options : [];
    const slug = createSlug(q.question);
    const canonicalUrl = `${SITE_URL}/quiz/question/${q.id}/${getCategorySlug(q.category)}/${slug}`;
    
    // SEO metadata
    const title = truncate(`${q.question} - Quiz Question`, 60);
    const description = truncate(
      `Test your knowledge: ${q.question} Category: ${q.category}. ${q.explanation || 'Challenge yourself with this trivia question!'}`,
      160
    );
    
    // Only use QAPage schema - avoid Quiz schema which causes Google's
    // "Invalid object type for field '<parent_node>'" error in Review snippets
    const qaPageSchema = {
      "@context": "https://schema.org",
      "@type": "QAPage",
      "name": q.question,
      "datePublished": q.created_at ? q.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      "author": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": SITE_URL
      },
      "mainEntity": {
        "@type": "Question",
        "name": q.question,
        "text": q.question,
        "answerCount": 1,
        "dateCreated": q.created_at ? q.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        ...(q.correct_answer ? {
          "acceptedAnswer": {
            "@type": "Answer",
            "text": q.correct_answer,
            "dateCreated": q.created_at ? q.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          }
        } : {}),
        "suggestedAnswer": options.filter(opt => opt !== q.correct_answer).map(opt => ({
          "@type": "Answer",
          "text": String(opt)
        }))
      }
    };
    
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": SITE_URL
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Quiz",
          "item": `${SITE_URL}/quiz`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": q.category,
          "item": `${SITE_URL}/categories/${createSlug(q.category)}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": truncate(q.question, 50),
          "item": canonicalUrl
        }
      ]
    };

    const ogImageUrl = `${supabaseUrl}/functions/v1/og-image?title=${encodeURIComponent(q.question.substring(0, 120))}&category=${encodeURIComponent(createSlug(q.category))}&difficulty=${encodeURIComponent(q.difficulty || 'medium')}`;

    // Generate the full HTML page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(q.category)}, trivia, quiz, ${escapeHtml(q.question.split(' ').slice(0, 5).join(', '))}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Robots -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(qaPageSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="${SITE_URL}/favicon.ico">
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #0f0f23; color: #fff; }
    .quiz-card { background: #1a1a2e; border-radius: 16px; padding: 32px; margin: 20px 0; }
    .category { color: #8b5cf6; font-size: 14px; text-transform: uppercase; margin-bottom: 16px; }
    .question { font-size: 24px; font-weight: 600; line-height: 1.4; margin-bottom: 24px; }
    .options { list-style: none; padding: 0; }
    .option { background: #16213e; border: 2px solid #2a2a4a; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
    .option:hover { border-color: #8b5cf6; background: #1e3a5f; }
    .difficulty { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; background: #2a2a4a; color: #a5b4fc; }
    .breadcrumb { color: #888; font-size: 14px; margin-bottom: 20px; }
    .breadcrumb a { color: #8b5cf6; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .cta { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: 600; }
    .loading { display: none; }
    #root:not(:empty) + .ssr-content { display: none; }
  </style>
</head>
<body>
  <!-- React App Mount Point -->
  <div id="root"></div>
  
  <!-- SSR Content (visible until React hydrates) -->
  <div class="ssr-content">
    <nav class="breadcrumb">
      <a href="${SITE_URL}">Home</a> › 
      <a href="${SITE_URL}/quiz">Quiz</a> › 
      <a href="${SITE_URL}/categories/${createSlug(q.category)}">${escapeHtml(q.category)}</a> › 
      Question
    </nav>
    
    <article class="quiz-card" itemscope itemtype="https://schema.org/Question">
      <div class="category">${escapeHtml(q.category)}</div>
      ${q.difficulty ? `<span class="difficulty">${escapeHtml(q.difficulty)}</span>` : ''}
      
      <h1 class="question" itemprop="name">${escapeHtml(q.question)}</h1>
      
      ${q.image_url ? `<img src="${escapeHtml(q.image_url)}" alt="Quiz question image" style="max-width:100%;border-radius:12px;margin-bottom:20px;">` : ''}
      
      <ul class="options" role="listbox">
        ${options.map((opt, i) => `
          <li class="option" role="option" data-option="${i}">
            <span style="font-weight:600;margin-right:12px;">${String.fromCharCode(65 + i)}.</span>
            ${escapeHtml(String(opt))}
          </li>
        `).join('')}
      </ul>
      
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #2a2a4a;">
        <p style="color:#888;font-size:14px;">
          Select an answer above to test your knowledge! 
          <a href="${SITE_URL}/quiz" style="color:#8b5cf6;">Play more quizzes →</a>
        </p>
      </div>
    </article>
    
    <section style="margin-top:32px;">
      <h2 style="font-size:18px;margin-bottom:16px;">More ${escapeHtml(q.category)} Questions</h2>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6; margin-bottom: 20px;">
        ${(related || []).map((r: any) => {
          const rSlug = createSlug(r.question);
          return `<li style="margin-bottom: 8px;">
            <a href="${SITE_URL}/quiz/question/${r.id}/${getCategorySlug(r.category)}/${rSlug}" style="color: #a78bfa; text-decoration: none;">
              ${escapeHtml(r.question)}
            </a>
          </li>`;
        }).join('')}
      </ul>
      <a href="${SITE_URL}/categories/${getCategorySlug(q.category)}" class="cta">
        Browse All ${escapeHtml(q.category)} Trivia
      </a>
    </section>
    
    <footer style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a4a;color:#666;font-size:14px;">
      <p>© ${new Date().getFullYear()} ${SITE_NAME} - Play trivia, earn rewards!</p>
      <nav style="margin-top:12px;">
        <a href="${SITE_URL}/faq" style="color:#888;margin-right:16px;">FAQ</a>
        <a href="${SITE_URL}/privacy" style="color:#888;margin-right:16px;">Privacy</a>
        <a href="${SITE_URL}/terms" style="color:#888;">Terms</a>
      </nav>
    </footer>
  </div>
  
  <!-- React App Bundle -->
  <script type="module">
    // Redirect to the React app for full interactivity
    const currentPath = window.location.pathname;
    if (!window.__REACT_HYDRATED__) {
      // Load the React app
      import('${SITE_URL}/src/main.tsx').catch(() => {
        // Fallback: redirect to the full app
        console.log('React app loading...');
      });
    }
  </script>
  
  <!-- Fallback redirect for JS-enabled browsers -->
  <script>
    // If React doesn't load within 3 seconds, the SSR content stays visible
    // This ensures search engines see the content
    setTimeout(function() {
      if (!document.getElementById('root').innerHTML) {
        console.log('SSR content displayed for SEO');
      }
    }, 3000);
  </script>
</body>
</html>`;

    console.log(`SSR generated for question: ${q.id} - ${truncate(q.question, 50)}`);
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Robots-Tag': 'index, follow',
      },
    });
    
  } catch (error) {
    console.error('SSR Error:', error);
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
