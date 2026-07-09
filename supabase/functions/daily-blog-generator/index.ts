
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require a valid JWT and admin role before allowing any writes.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    const userId = claimsData?.claims?.sub
    if (claimsError || !userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service-role client for privileged operations (role check + insert).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()
    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Define blog generation logic
    const generateBlogPost = () => {
      const categories = [
        'Quiz Strategies', 
        'Learning Tips', 
        'Game Mechanics', 
        'CuizIN Updates', 
        'Player Success Stories'
      ]

      const titles = [
        'Mastering Quiz Techniques: Pro Tips',
        'How to Improve Your Quiz Performance',
        'The Science of Learning Through Quizzes',
        'Maximizing Your Earnings on CuizIN',
        'Success Stories from Top CuizIN Players'
      ]

      const randomContent = (title: string) => `
# ${title}

In the world of online quizzing, success is not just about knowledge, but strategy. At CuizIN, we've seen thousands of players transform their learning experience through our innovative platform.

## Key Insights

1. **Consistency is Key**: Regular practice makes perfect
2. **Strategic Approach**: Understanding quiz mechanics
3. **Continuous Learning**: Every quiz is an opportunity to grow

## Why CuizIN?

Our platform isn't just about earning points - it's about personal growth, knowledge expansion, and fun!

Stay curious, stay learning!

The CuizIN Team
      `

      // Generate a unique slug from the title
      const generateSlug = (title: string) => {
        return title
          .toLowerCase()
          .replace(/[^\w\s]/gi, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 100) // Limit length
          + '-' + new Date().getTime().toString().slice(-4); // Add timestamp for uniqueness
      }

      const category = categories[Math.floor(Math.random() * categories.length)]
      const title = titles[Math.floor(Math.random() * titles.length)]
      const slug = generateSlug(title)

      return {
        title,
        content: randomContent(title),
        category,
        excerpt: title.substring(0, 100),
        is_published: true,
        slug: slug, // Add the generated slug
        author: 'CuizIN Team'
      }
    }

    const newBlogPost = generateBlogPost()

    // Insert the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(newBlogPost)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ 
      success: true, 
      data: data 
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Blog generation error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})
