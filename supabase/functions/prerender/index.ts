import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Prerender Edge Function
 * --------------------------------------------------------------
 * Serves fully-rendered HTML to search engine crawlers (Googlebot,
 * Bingbot, Twitterbot, facebookexternalhit, LinkedInBot, etc.) so that
 * they index real content instead of an empty React shell.
 *
 * Real users get a 302 redirect to the SPA so UX is unchanged.
 *
 * Routing handled by /public/_redirects (User-Agent based) or by
 * direct invocation: /functions/v1/prerender?path=/categories/history
 */

const SUPABASE_URL = "https://pgywvtphfidouakypdno.supabase.co";
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";

const SITE_URL = "https://cuiz.in";
const SITE_NAME = "CuizIN";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOT_REGEX =
  /(googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|sogou|exabot|facebot|facebookexternalhit|twitterbot|linkedinbot|embedly|whatsapp|telegrambot|applebot|pinterest|redditbot|discordbot|slackbot|w3c_validator|ia_archiver|ahrefsbot|semrushbot|petalbot|chrome-lighthouse)/i;

function isBot(ua: string | null): boolean {
  if (!ua) return false;
  return BOT_REGEX.test(ua);
}

function escapeHtml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const STOP_WORDS = [
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don',
  'should', 'now', 'this', 'that', 'these', 'those', 'from', 'with', 'about', 'have',
  'what', 'which', 'their', 'they', 'them', 'there', 'been', 'being', 'into', 'does',
  'your', 'over', 'under', 'again', 'once', 'here', 'there', 'when', 'who'
];

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.includes(word));
  return [...new Set(words)];
}

function slugify(text: string, maxLen = 80): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, maxLen)
    .replace(/-$/, "");
}

function htmlShell(opts: {
  title: string;
  description: string;
  canonical: string;
  body: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}): string {
  const schemaTag = opts.schema
    ? `<script type="application/ld+json">${JSON.stringify(opts.schema)}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<link rel="canonical" href="${escapeHtml(opts.canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(opts.title)}" />
<meta property="og:description" content="${escapeHtml(opts.description)}" />
<meta property="og:url" content="${escapeHtml(opts.canonical)}" />
<meta property="og:image" content="${SITE_URL}/og-image-cuizin.png" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(opts.title)}" />
<meta name="twitter:description" content="${escapeHtml(opts.description)}" />
<meta name="twitter:image" content="${SITE_URL}/og-image-cuizin.png" />
${schemaTag}
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:960px;margin:0 auto;padding:24px;color:#0f172a;background:#fff;line-height:1.55}
a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:28px;margin:0 0 12px}h2{font-size:20px;margin:24px 0 10px}h3{font-size:16px;margin:18px 0 8px}
nav.bc{font-size:14px;color:#64748b;margin-bottom:16px}
ul.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;list-style:none;padding:0}
ul.cards li{border:1px solid #e2e8f0;border-radius:8px;padding:12px}
ul.list{padding-left:18px}ul.list li{margin:4px 0}
footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b}
.tag{display:inline-block;background:#f1f5f9;color:#475569;border-radius:4px;padding:2px 8px;font-size:12px;margin-right:6px}
</style>
</head>
<body>
<header><a href="${SITE_URL}/"><strong>CuizIN</strong></a> &mdash; <a href="${SITE_URL}/quiz">Play Quiz</a> &middot; <a href="${SITE_URL}/categories">Categories</a> &middot; <a href="${SITE_URL}/blog">Blog</a> &middot; <a href="${SITE_URL}/faq">FAQ</a></header>
<main>${opts.body}</main>
<footer>
<p>&copy; ${new Date().getFullYear()} CuizIN &mdash; Free online quiz game. Play, learn, and climb the leaderboard.</p>
<p><a href="${SITE_URL}/sitemap.xml">Sitemap</a> &middot; <a href="${SITE_URL}/terms">Terms</a> &middot; <a href="${SITE_URL}/privacy">Privacy</a> &middot; <a href="${SITE_URL}/disclaimer">Disclaimer</a></p>
</footer>
</body>
</html>`;
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "X-Robots-Tag": "index,follow",
    },
  });
}

// ---------- Page builders ----------


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
};
function getCategorySlug(cat: string): string {
  return categoryToSlugMap[cat] || 'general-knowledge';
}

async function buildHomepage(supabase: any): Promise<string> {
  const [{ data: cats }, { data: recent }, { data: counts }] = await Promise.all([
    supabase.from("quiz_questions").select("category"),
    supabase
      .from("quiz_questions")
      .select("id,question,category")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("quiz_questions").select("id", { count: "exact", head: true }),
  ]);

  const counter = new Map<string, number>();
  (cats || []).forEach((c: any) => {
    const k = (c.category || "").trim();
    if (k) counter.set(k, (counter.get(k) || 0) + 1);
  });
  const topCats = [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  const total = counts ?? (cats || []).length;

  const categoryList = topCats
    .map(
      ([name, count]) =>
        `<li><a href="${SITE_URL}/categories/${slugify(name)}"><strong>${escapeHtml(name)}</strong></a><br><span class="tag">${count} questions</span></li>`
    )
    .join("");

  const recentList = (recent || [])
    .slice(0, 30)
    .map(
      (q: any) =>
        `<li><a href="${SITE_URL}/quiz/question/${q.id}/${getCategorySlug(q.category)}/${slugify(q.question)}">${escapeHtml(q.question)}</a> <span class="tag">${escapeHtml(q.category || "")}</span></li>`
    )
    .join("");

  const body = `
<h1>CuizIN &mdash; Free Online Quiz Game | Play & Learn</h1>
<p>Test your knowledge across <strong>${total}+ quiz questions</strong> covering history, science, geography, sports, entertainment, literature, and more. Play free, earn points, and climb the leaderboard.</p>
<p><a href="${SITE_URL}/quiz"><strong>Start Playing &rarr;</strong></a> &middot; <a href="${SITE_URL}/register">Create Account</a> &middot; <a href="${SITE_URL}/how-to-play">How to Play</a></p>

<h2>Browse Quiz Categories</h2>
<ul class="cards">${categoryList}</ul>

<h2>Recently Added Questions</h2>
<ul class="list">${recentList}</ul>

<h2>Why Play CuizIN?</h2>
<ul class="list">
<li>100% free to play &mdash; no payment required</li>
<li>${total}+ trivia questions across 30+ categories</li>
<li>Daily streak bonuses and a global leaderboard</li>
<li>Detailed explanations after every answer to help you learn</li>
<li>Mobile-friendly with offline support via PWA</li>
</ul>

<h2>Popular Sections</h2>
<ul class="list">
<li><a href="${SITE_URL}/categories">All Quiz Categories</a></li>
<li><a href="${SITE_URL}/all-questions">All Quiz Questions</a></li>
<li><a href="${SITE_URL}/browse">Browse Questions</a></li>
<li><a href="${SITE_URL}/topics">Quiz Topics</a></li>
<li><a href="${SITE_URL}/blog">Quiz Blog &amp; Trivia Articles</a></li>
<li><a href="${SITE_URL}/faq">Frequently Asked Questions</a></li>
<li><a href="${SITE_URL}/stories">Quiz Web Stories</a></li>
<li><a href="${SITE_URL}/referral-program">Referral Program</a></li>
</ul>`;

  return htmlShell({
    title: "CuizIN - Play Quiz & Learn | Free Online Quiz Game",
    description: `Play ${total}+ free quiz questions across history, science, geography, sports & more. Earn points, climb the leaderboard, learn facts. India's free quiz platform.`,
    canonical: `${SITE_URL}/`,
    body,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: SITE_URL,
      name: "CuizIN",
      description:
        "Free online quiz platform with thousands of trivia questions.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/quiz?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });
}

async function buildCategoriesIndex(supabase: any): Promise<string> {
  const { data } = await supabase.from("quiz_questions").select("category");
  const counter = new Map<string, number>();
  (data || []).forEach((c: any) => {
    const k = (c.category || "").trim();
    if (k) counter.set(k, (counter.get(k) || 0) + 1);
  });
  const list = [...counter.entries()].sort((a, b) => b[1] - a[1]);

  const items = list
    .map(
      ([n, c]) =>
        `<li><a href="${SITE_URL}/categories/${slugify(n)}"><strong>${escapeHtml(n)}</strong></a> &mdash; ${c} questions</li>`
    )
    .join("");

  return htmlShell({
    title: "All Quiz Categories | CuizIN",
    description: `Explore ${list.length} quiz categories with thousands of trivia questions. Pick a topic and start playing for free.`,
    canonical: `${SITE_URL}/categories`,
    body: `<nav class="bc"><a href="${SITE_URL}/">Home</a> &rsaquo; Categories</nav>
<h1>All Quiz Categories</h1>
<p>Choose from ${list.length} quiz categories covering ${(data || []).length}+ questions.</p>
<ul class="list">${items}</ul>`,
  });
}

async function buildCategoryDetail(
  supabase: any,
  slug: string
): Promise<{html: string, status: number}> {
  const { data: all } = await supabase
    .from("quiz_questions")
    .select("id,question,category,difficulty");
  const matches = (all || []).filter(
    (q: any) => slugify(q.category || "") === slug
  );
  if (matches.length === 0) {
    const html = htmlShell({
      title: "Category Not Found | CuizIN",
      description: "The requested quiz category was not found.",
      canonical: `${SITE_URL}/categories/${slug}`,
      body: `<h1>Category not found</h1><p><a href="${SITE_URL}/categories">Browse all categories</a></p>`,
    });
    return { html, status: 404 };
  }
  const catName = matches[0].category;
  const items = matches
    .slice(0, 200)
    .map(
      (q: any) =>
        `<li><a href="${SITE_URL}/quiz/question/${q.id}/${getCategorySlug(q.category)}/${slugify(q.question)}">${escapeHtml(q.question)}</a>${q.difficulty ? ` <span class="tag">${escapeHtml(q.difficulty)}</span>` : ""}</li>`
    )
    .join("");

  const html = htmlShell({
    title: `${catName} Quiz Questions | CuizIN`,
    description: `Play ${matches.length} ${catName} quiz questions. Test your knowledge and earn points on CuizIN.`,
    canonical: `${SITE_URL}/categories/${slug}`,
    body: `<nav class="bc"><a href="${SITE_URL}/">Home</a> &rsaquo; <a href="${SITE_URL}/categories">Categories</a> &rsaquo; ${escapeHtml(catName)}</nav>
<h1>${escapeHtml(catName)} Quiz Questions</h1>
<p>${matches.length} questions in this category. Click any question to play.</p>
<ul class="list">${items}</ul>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${catName} Quiz Questions`,
      url: `${SITE_URL}/categories/${slug}`,
    },
  });
  return { html, status: 200 };
}

async function buildBlogIndex(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(100);
  const items = (data || [])
    .map(
      (p: any) =>
        `<li><a href="${SITE_URL}/blog/${p.slug}"><strong>${escapeHtml(p.title)}</strong></a>${p.excerpt ? `<br><span>${escapeHtml(p.excerpt)}</span>` : ""}</li>`
    )
    .join("");
  return htmlShell({
    title: "Quiz Blog & Trivia Articles | CuizIN",
    description:
      "Read the latest quiz blog posts, trivia facts, study guides and quiz strategies on CuizIN.",
    canonical: `${SITE_URL}/blog`,
    body: `<nav class="bc"><a href="${SITE_URL}/">Home</a> &rsaquo; Blog</nav>
<h1>Quiz Blog & Trivia Articles</h1>
<ul class="list">${items || "<li>No posts yet.</li>"}</ul>`,
  });
}

async function buildBlogPost(supabase: any, slug: string): Promise<{html: string, status: number}> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) {
    const html = htmlShell({
      title: "Post not found | CuizIN",
      description: "The requested blog post was not found.",
      canonical: `${SITE_URL}/blog/${slug}`,
      body: `<h1>Post not found</h1><p><a href="${SITE_URL}/blog">Back to blog</a></p>`,
    });
    return { html, status: 404 };
  }
  const html = htmlShell({
    title: `${data.title} | CuizIN Blog`,
    description: data.excerpt || data.title,
    canonical: `${SITE_URL}/blog/${slug}`,
    body: `<nav class="bc"><a href="${SITE_URL}/">Home</a> &rsaquo; <a href="${SITE_URL}/blog">Blog</a> &rsaquo; ${escapeHtml(data.title)}</nav>
<article>
<h1>${escapeHtml(data.title)}</h1>
<p><em>${data.author ? "By " + escapeHtml(data.author) + " &middot; " : ""}${data.published_at ? new Date(data.published_at).toDateString() : ""}</em></p>
${data.content || ""}
</article>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title,
      datePublished: data.published_at,
      dateModified: data.updated_at,
      author: { "@type": "Person", name: data.author || "CuizIN" },
      mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    },
  });
  return { html, status: 200 };
}

async function buildFaqIndex(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("faqs")
    .select("id,question,answer,category")
    .eq("is_published", true)
    .order("order_index", { ascending: true })
    .limit(200);
  const items = (data || [])
    .map(
      (f: any) =>
        `<li><a href="${SITE_URL}/faq/${f.id}"><strong>${escapeHtml(f.question)}</strong></a><br>${escapeHtml((f.answer || "").substring(0, 200))}...</li>`
    )
    .join("");

  const schemaItems = (data || []).slice(0, 50).map((f: any) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  }));

  return htmlShell({
    title: "Frequently Asked Questions | CuizIN",
    description:
      "Answers to common questions about CuizIN: how to play, points, leaderboards, accounts, and more.",
    canonical: `${SITE_URL}/faq`,
    body: `<nav class="bc"><a href="${SITE_URL}/">Home</a> &rsaquo; FAQ</nav>
<h1>Frequently Asked Questions</h1>
<ul class="list">${items || "<li>No FAQs yet.</li>"}</ul>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: schemaItems,
    },
  });
}

async function buildQuestionPage(supabase: any, id: string): Promise<{html: string, status: number}> {
  const { data: q, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !q) {
    const html = htmlShell({
      title: "Question Not Found | CuizIN",
      description: "The requested quiz question was not found.",
      canonical: `${SITE_URL}/quiz/question/${id}`,
      body: `<h1>Question not found</h1><p><a href="${SITE_URL}/quiz">Browse all quizzes</a></p>`,
    });
    return { html, status: 404 };
  }

  const options = Array.isArray(q.options) ? q.options : [];
  const slug = slugify(q.question);
  const canonical = `${SITE_URL}/quiz/question/${q.id}/${getCategorySlug(q.category)}/${slug}`;
  const title = `${q.question} - ${q.category} Quiz | CuizIN`;
  const description = `Trivia: ${q.question} Category: ${q.category}. Play this ${q.difficulty || "medium"} difficulty quiz question and earn points on CuizIN.`;

  // Dynamic keyword generation
  const extracted = extractKeywords(q.question);
  options.forEach((opt: any) => extracted.push(...extractKeywords(String(opt))));
  extracted.push(q.category.toLowerCase(), 'quiz', 'trivia', 'questions');
  const keywords = [...new Set(extracted)].slice(0, 15).join(', ');

  // Fetch related questions for internal linking (crawl path)
  const { data: related } = await supabase
    .from("quiz_questions")
    .select("id, question")
    .eq("category", q.category)
    .neq("id", q.id)
    .limit(5);

  const relatedList = (related || [])
    .map((r: any) => `<li><a href="${SITE_URL}/quiz/question/${r.id}/${getCategorySlug(q.category)}/${slugify(r.question)}">${escapeHtml(r.question)}</a></li>`)
    .join("");

  const body = `
<nav class="bc"><a href="${SITE_URL}/">Home</a> &rsaquo; <a href="${SITE_URL}/quiz">Quiz</a> &rsaquo; <a href="${SITE_URL}/categories/${slugify(q.category)}">${escapeHtml(q.category)}</a> &rsaquo; Question</nav>
<article itemscope itemtype="https://schema.org/Question">
  <div class="tag">${escapeHtml(q.category)}</div>
  ${q.difficulty ? `<span class="tag">${escapeHtml(q.difficulty)}</span>` : ""}
  <h1 itemprop="name">${escapeHtml(q.question)}</h1>
  
  <p>Choose the correct answer from the options below:</p>
  <ul class="list">
    ${options.map((opt: any, i: number) => `<li><strong>${String.fromCharCode(65 + i)}.</strong> ${escapeHtml(String(opt))}</li>`).join("")}
  </ul>
  
  <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
    <p><strong>Answer & Explanation:</strong></p>
    <p>Play the quiz on CuizIN to see the correct answer and detailed explanation! Build your streak and climb the leaderboard.</p>
    <a href="${canonical}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;font-weight:600;">Play Now &rarr;</a>
  </div>
</article>

<section style="margin-top:32px;">
  <h2>More ${escapeHtml(q.category)} Questions</h2>
  <ul class="list">
    ${relatedList || "<li>No related questions found.</li>"}
  </ul>
  <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;">
    <a href="${SITE_URL}/categories/${slugify(q.category)}" class="tag">${escapeHtml(q.category)} Quiz</a>
    <a href="${SITE_URL}/quiz" class="tag">Free Trivia</a>
    <a href="${SITE_URL}/all-questions" class="tag">Browse All Questions</a>
  </div>
</section>`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "QAPage",
      mainEntity: {
        "@type": "Question",
        name: q.question,
        text: q.question,
        answerCount: 1,
        ...(q.correct_answer ? {
          acceptedAnswer: {
            "@type": "Answer",
            text: q.correct_answer,
          }
        } : {}),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Quiz", item: `${SITE_URL}/quiz` },
        { "@type": "ListItem", position: 3, name: q.category, item: `${SITE_URL}/categories/${slugify(q.category)}` },
      ],
    },
  ];

  const html = htmlShell({ title, description, canonical, body, schema });
  // Inject keywords meta tag into the shell
  const htmlWithKeywords = html.replace('</title>', `</title>\n<meta name="keywords" content="${escapeHtml(keywords)}" />`);

  return { html: htmlWithKeywords, status: 200 };
}

// ---------- Router ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ua = req.headers.get("user-agent");
    const path =
      url.searchParams.get("path") ||
      url.pathname.replace(/^\/functions\/v1\/prerender/, "") ||
      "/";
    const cleanPath = path === "" ? "/" : path;

    // Non-bot? Send them to the SPA
    const force = url.searchParams.get("force") === "1";
    if (!force && !isBot(ua)) {
      return Response.redirect(`${SITE_URL}${cleanPath}`, 302);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Route matching
    if (cleanPath === "/" || cleanPath === "/index.html") {
      return htmlResponse(await buildHomepage(supabase));
    }
    if (cleanPath === "/categories" || cleanPath === "/categories/") {
      return htmlResponse(await buildCategoriesIndex(supabase));
    }
    const catMatch = cleanPath.match(/^\/categories\/([^\/]+)\/?$/);
    if (catMatch) {
      const result = await buildCategoryDetail(supabase, catMatch[1]);
      return htmlResponse(result.html, result.status);
    }
    
    // Quiz Question Routing
    const questMatch = cleanPath.match(/^\/quiz\/question\/([^\/]+)(\/.*)?$/);
    if (questMatch) {
      const result = await buildQuestionPage(supabase, questMatch[1]);
      return htmlResponse(result.html, result.status);
    }

    if (cleanPath === "/blog" || cleanPath === "/blog/") {
      return htmlResponse(await buildBlogIndex(supabase));
    }
    const blogMatch = cleanPath.match(/^\/blog\/([^\/]+)\/?$/);
    if (blogMatch) {
      const result = await buildBlogPost(supabase, blogMatch[1]);
      return htmlResponse(result.html, result.status);
    }
    if (cleanPath === "/faq" || cleanPath === "/faq/") {
      return htmlResponse(await buildFaqIndex(supabase));
    }

    // Fallback: minimal homepage
    return htmlResponse(await buildHomepage(supabase));
  } catch (err) {
    console.error("Prerender error:", err);
    return new Response("Prerender error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});