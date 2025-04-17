
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define categories that match our quiz categories
const CATEGORIES = [
  "History", 
  "Science", 
  "Geography", 
  "Literature", 
  "Entertainment", 
  "Sports", 
  "Technology", 
  "General Knowledge"
];

// Define the structure for blog post templates
interface BlogPostTemplate {
  titleTemplate: string;
  contentTemplate: string;
}

// Templates for different types of blog posts
const BLOG_TEMPLATES: Record<string, BlogPostTemplate[]> = {
  "History": [
    {
      titleTemplate: "10 Fascinating Facts About {topic} That Will Surprise You",
      contentTemplate: `
# 10 Fascinating Facts About {topic} That Will Surprise You

History is full of unexpected twists and fascinating stories. Today, we're exploring some incredible facts about {topic} that might surprise even the most dedicated history buffs.

## 1. The Unexpected Origins
Did you know that {topic} actually began in a completely different context than most people realize? Historical records show that the early developments were quite different from what we understand today.

## 2. Famous Figures
Several important historical figures played key roles in shaping {topic} as we know it today. Their contributions often go unrecognized in popular accounts.

## 3. Hidden Connections
There are surprising connections between {topic} and other major historical events that occurred around the same time period.

## 4. Myths vs. Reality
Many common beliefs about {topic} are actually misconceptions that have been perpetuated over time. The historical reality is quite different.

## 5. Archaeological Discoveries
Recent discoveries have shed new light on our understanding of {topic}, challenging previous assumptions.

## 6. Cultural Impact
The influence of {topic} on art, literature, and social structures of the time was profound and can still be seen today.

## 7. Geographic Spread
The way {topic} spread geographically reveals interesting patterns about human migration and cultural exchange.

## 8. Technological Connections
The relationship between {topic} and technological developments of the period offers fascinating insights.

## 9. Lost Knowledge
Some aspects of {topic} were almost lost to history before being rediscovered through careful historical research.

## 10. Modern Relevance
While {topic} might seem like distant history, its impact continues to shape our modern world in surprising ways.

How many of these facts did you already know? Test your knowledge with our daily quizzes!
      `
    },
    {
      titleTemplate: "The Untold Story of {topic}: History's Greatest Mystery",
      contentTemplate: `
# The Untold Story of {topic}: History's Greatest Mystery

Some historical events remain shrouded in mystery despite years of research. Today we're exploring one of history's most intriguing puzzles: {topic}.

## The Mystery Begins
The story of {topic} starts with unusual circumstances that historians still debate today. What we know for certain is surprisingly limited.

## Conflicting Accounts
Historical sources offer contradictory information about {topic}, making it difficult to separate fact from fiction.

## Key Players
Several important figures were involved in {topic}, each with their own motivations and perspectives that complicate our understanding.

## Evidence and Artifacts
The physical evidence related to {topic} provides tantalizing clues but also raises new questions for researchers.

## Theories and Speculations
Over the years, historians have proposed various theories to explain {topic}, ranging from the conventional to the controversial.

## Modern Investigation Methods
New technologies and research methods have allowed historians to revisit {topic} with fresh perspectives and tools.

## Why It Matters
Understanding {topic} isn't just about solving a historical puzzle—it has implications for how we view other aspects of history as well.

## The Quest Continues
Research into {topic} continues today, with new discoveries still possible as archives are digitized and new analysis techniques emerge.

What theories do you have about this historical mystery? Join the conversation and test your knowledge with our daily quizzes!
      `
    },
  ],
  "Science": [
    {
      titleTemplate: "The Science Behind {topic}: What You Need to Know",
      contentTemplate: `
# The Science Behind {topic}: What You Need to Know

Science helps us understand the world around us, and today we're diving into the fascinating science of {topic}.

## The Basics
At its core, {topic} involves fundamental scientific principles that govern how this phenomenon works.

## Historical Development
Our understanding of {topic} has evolved significantly over time, with several breakthrough moments changing scientific consensus.

## Key Research
Notable scientists have dedicated their careers to investigating {topic}, leading to important discoveries.

## Practical Applications
The science of {topic} isn't just theoretical—it has numerous practical applications in our daily lives.

## Current Challenges
Scientists studying {topic} still face several unresolved questions and technical challenges.

## Future Directions
Emerging technologies promise to advance our understanding of {topic} in exciting new ways.

## Misconceptions
There are several common misconceptions about {topic} that scientific evidence has disproven.

## Ethical Considerations
The study and application of {topic} raises important ethical questions for society to consider.

How much did you already know about the science of {topic}? Test your knowledge with our daily science quizzes!
      `
    },
  ],
  "Geography": [
    {
      titleTemplate: "Exploring {topic}: A Geographic Wonder",
      contentTemplate: `
# Exploring {topic}: A Geographic Wonder

Our planet is full of incredible geographic features and regions. Today's spotlight is on the remarkable {topic}.

## Location and Formation
{topic} is located in a unique geographic setting, and its formation involved fascinating geological processes.

## Physical Characteristics
The distinctive features of {topic} make it stand out from similar geographic formations around the world.

## Climate and Ecosystem
{topic} hosts a specialized ecosystem adapted to its particular environmental conditions.

## Human Interaction
People have interacted with {topic} in various ways throughout history, leaving their mark on this natural wonder.

## Conservation Status
Like many geographic treasures, {topic} faces certain environmental challenges and conservation efforts.

## Cultural Significance
Different cultures have incorporated {topic} into their traditions, stories, and identities.

## Tourism and Access
For those interested in visiting, {topic} offers unique experiences but also presents certain logistical considerations.

Want to test your knowledge of world geography? Try our daily geography quizzes!
      `
    },
  ],
  "Literature": [
    {
      titleTemplate: "Literary Masterpieces: Understanding {topic}",
      contentTemplate: `
# Literary Masterpieces: Understanding {topic}

Literature enriches our lives and provides insights into the human condition. Today, we're exploring {topic} and its literary significance.

## Historical Context
{topic} emerged during a specific literary period that influenced its themes and style.

## Key Features
Several distinctive elements make {topic} recognizable and significant in the literary world.

## Notable Works
Certain works exemplify {topic} at its finest, showcasing why this literary element remains important.

## Cultural Impact
{topic} has influenced not just literature but other art forms and cultural expressions.

## Evolution Over Time
How {topic} has changed through different eras reveals shifting cultural values and artistic approaches.

## Critical Reception
Literary critics have offered various perspectives on {topic}, from celebration to critique.

## Modern Relevance
Despite changes in reading habits and literary trends, {topic} continues to resonate with contemporary readers.

How familiar are you with {topic} in literature? Test your knowledge with our daily literature quizzes!
      `
    },
  ],
  "Entertainment": [
    {
      titleTemplate: "The Evolution of {topic} in Entertainment",
      contentTemplate: `
# The Evolution of {topic} in Entertainment

Entertainment reflects our culture while also shaping it. Today we're looking at how {topic} has evolved in the entertainment industry.

## Early Beginnings
{topic} first appeared in entertainment in simpler forms that laid the groundwork for what was to come.

## Golden Era
Most fans consider a specific period as the golden age of {topic} in entertainment, when innovation and popularity peaked.

## Technological Influences
Advances in technology have transformed how {topic} is created and consumed over time.

## Cultural Significance
{topic} has often reflected broader social trends and sometimes even influenced cultural conversations.

## Notable Examples
Certain works stand out as defining moments for {topic} in entertainment history.

## Behind the Scenes
The creation of {topic} in entertainment involves fascinating production processes that audiences rarely see.

## Future Trends
Emerging patterns suggest where {topic} might be heading next in the entertainment landscape.

How well do you know the history of entertainment? Test your knowledge with our daily entertainment quizzes!
      `
    },
  ],
  "Sports": [
    {
      titleTemplate: "The Greatest Moments in {topic} History",
      contentTemplate: `
# The Greatest Moments in {topic} History

Sports create unforgettable moments of human achievement and drama. Today, we're revisiting some of the greatest moments in {topic} history.

## The Early Days
{topic} has origins that many fans may not be familiar with, setting the stage for the sport we know today.

## Record-Breaking Performances
Certain athletes have set astonishing records in {topic} that showcase the limits of human potential.

## Legendary Rivalries
Great rivalries have defined eras in {topic}, creating compelling narratives that transcend individual games.

## Underdog Stories
Some of the most inspiring moments in {topic} involve unexpected triumphs against overwhelming odds.

## Innovation and Evolution
The rules, equipment, and strategies in {topic} have evolved significantly, changing how the sport is played.

## Global Impact
{topic} has united people across cultural and national boundaries while also reflecting international competitions.

## Unforgettable Personalities
Certain figures have become synonymous with {topic}, their influence extending beyond their athletic achievements.

Are you a true sports fan? Test your knowledge of {topic} with our daily sports quizzes!
      `
    },
  ],
  "Technology": [
    {
      titleTemplate: "How {topic} is Changing Our World",
      contentTemplate: `
# How {topic} is Changing Our World

Technology continues to transform every aspect of human life. Today we're exploring how {topic} is reshaping our world.

## The Innovation Journey
{topic} didn't appear overnight—it evolved through various stages of development and refinement.

## How It Works
Understanding the basic mechanisms behind {topic} helps appreciate its capabilities and limitations.

## Real-World Applications
{topic} is already being applied in various fields, sometimes in ways that might surprise you.

## Social Impact
The adoption of {topic} has significant implications for how we interact, work, and live.

## Ethical Considerations
Like many technological advances, {topic} raises important ethical questions that deserve consideration.

## Future Potential
Experts predict several ways {topic} might develop further in the coming years.

## Accessibility and Adoption
The spread of {topic} faces both opportunities and challenges as it reaches new users.

Are you keeping up with technological changes? Test your knowledge with our daily technology quizzes!
      `
    },
  ],
  "General Knowledge": [
    {
      titleTemplate: "Everything You Need to Know About {topic}",
      contentTemplate: `
# Everything You Need to Know About {topic}

General knowledge encompasses many fields and subjects. Today we're providing a comprehensive overview of {topic}.

## Essential Background
Understanding {topic} requires some basic context about its origins and development.

## Key Concepts
Several fundamental ideas form the foundation for understanding {topic} properly.

## Common Misconceptions
Many people have incorrect assumptions about {topic} that are worth clarifying.

## Practical Relevance
Knowing about {topic} has practical applications in everyday life and decision-making.

## Expert Perspectives
Specialists in different fields offer diverse insights into {topic}, highlighting its multifaceted nature.

## Cultural Variations
{topic} may be understood differently across various cultural contexts and traditions.

## Resources for Learning More
For those interested in deeper exploration, various resources provide more detailed information about {topic}.

How broad is your general knowledge? Test yourself with our daily general knowledge quizzes!
      `
    },
  ]
};

// Topics for each category
const TOPICS_BY_CATEGORY: Record<string, string[]> = {
  "History": [
    "Ancient Egypt", "The Roman Empire", "World War II", "The Renaissance", 
    "The Industrial Revolution", "The Cold War", "Ancient Greece", "The Ottoman Empire",
    "The American Civil War", "The French Revolution", "The Silk Road", "The Ming Dynasty",
    "The Byzantine Empire", "The Age of Exploration", "The Inca Empire", "The Russian Revolution",
    "The British Empire", "Ancient Mesopotamia", "The Crusades", "Medieval Europe"
  ],
  "Science": [
    "Quantum Physics", "Genetic Engineering", "Climate Change", "Dark Matter",
    "Artificial Intelligence", "Stem Cell Research", "Renewable Energy", "Nanotechnology",
    "Space Exploration", "Nuclear Fusion", "Evolutionary Biology", "Neuroscience",
    "Immunology", "Quantum Computing", "Astrophysics", "Marine Biology",
    "Biochemistry", "Ecology", "Particle Physics", "Robotics"
  ],
  "Geography": [
    "The Amazon Rainforest", "The Himalayas", "The Great Barrier Reef", "The Sahara Desert",
    "The Grand Canyon", "The Arctic Circle", "The Mediterranean Sea", "The Nile River",
    "The Andes Mountains", "The Great Lakes", "The Panama Canal", "Victoria Falls",
    "The Alps", "The Galapagos Islands", "The Black Sea", "Mount Everest",
    "The Mississippi River", "The Dead Sea", "The Northern Lights", "The Serengeti"
  ],
  "Literature": [
    "Shakespearean Tragedy", "Modern Poetry", "The Victorian Novel", "Science Fiction",
    "Magical Realism", "Epic Poetry", "Postcolonial Literature", "Romantic Literature",
    "Gothic Fiction", "Modernist Writing", "Dystopian Fiction", "Children's Literature",
    "Literary Symbolism", "Feminist Literature", "War Poetry", "The Beat Generation",
    "The Harlem Renaissance", "Absurdist Drama", "Literary Realism", "Memoir Writing"
  ],
  "Entertainment": [
    "Hollywood's Golden Age", "Video Game Evolution", "Music Streaming", "Reality Television",
    "Superhero Movies", "Social Media Influencers", "Broadway Musicals", "Animation Techniques",
    "Stand-up Comedy", "Film Noir", "K-Pop", "Virtual Reality Entertainment",
    "Movie Special Effects", "Music Festivals", "Celebrity Culture", "Documentary Filmmaking",
    "Podcast Revolution", "Interactive Entertainment", "Film Franchises", "Digital Art"
  ],
  "Sports": [
    "Olympic History", "World Cup Football", "Tennis Grand Slams", "NBA Basketball",
    "Cricket", "Rugby", "Formula One Racing", "Golf Majors",
    "Boxing", "Winter Olympics", "Baseball", "Swimming Championships",
    "Marathon Running", "Extreme Sports", "E-sports", "Volleyball",
    "Gymnastics", "Cycling", "Martial Arts", "Athletics"
  ],
  "Technology": [
    "Blockchain", "Cloud Computing", "5G Networks", "Virtual Reality",
    "Internet of Things", "Machine Learning", "Cybersecurity", "Autonomous Vehicles",
    "Social Media Algorithms", "3D Printing", "Wearable Technology", "Biometric Authentication",
    "Edge Computing", "Augmented Reality", "Quantum Encryption", "Smart Home Technology",
    "Drone Technology", "Facial Recognition", "Digital Twins", "Space Technology"
  ],
  "General Knowledge": [
    "World Currencies", "Famous Landmarks", "National Flags", "Global Cuisines",
    "Musical Instruments", "Art Movements", "World Languages", "Traditional Costumes",
    "Natural Wonders", "Mythologies", "World Religions", "Human Migration",
    "Global Architecture", "World Leaders", "International Relations", "Cultural Festivals",
    "Historic Trade Routes", "Traditional Medicine", "Indigenous Communities", "Global Demographics"
  ]
};

/**
 * Generate a slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Get a random item from an array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a blog post based on quiz categories
 */
async function generateBlogPost() {
  // Select a random category
  const category = getRandomItem(CATEGORIES);
  
  // Get templates for this category
  const templates = BLOG_TEMPLATES[category] || BLOG_TEMPLATES["General Knowledge"];
  const template = getRandomItem(templates);
  
  // Get topics for this category
  const topics = TOPICS_BY_CATEGORY[category] || TOPICS_BY_CATEGORY["General Knowledge"];
  const topic = getRandomItem(topics);
  
  // Generate title and content
  const title = template.titleTemplate.replace(/\{topic\}/g, topic);
  const content = template.contentTemplate.replace(/\{topic\}/g, topic);
  
  // Generate excerpt (first paragraph)
  const excerpt = content.split("\n\n")[1] || "Explore the fascinating world of " + topic + " in our latest blog post.";
  
  // Generate slug
  const slug = generateSlug(title);
  
  return {
    title,
    content,
    excerpt,
    slug,
    category,
    is_published: true,
    author: "Quiz Bot",
    published_at: new Date().toISOString()
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Initialize Supabase client with edge function auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    console.log("Generating a new blog post...");
    
    // Generate a new blog post
    const newPost = await generateBlogPost();
    
    // Check if we've already created a post today to prevent duplicates
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    
    const { data: existingPosts } = await supabaseClient
      .from("blog_posts")
      .select("*")
      .eq("author", "Quiz Bot")
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay);
      
    if (existingPosts && existingPosts.length > 0) {
      console.log("A post has already been created today. Skipping.");
      return new Response(
        JSON.stringify({ 
          message: "A post has already been created today. Skipping.",
          existingPost: existingPosts[0]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Insert the new blog post
    const { data, error } = await supabaseClient
      .from("blog_posts")
      .insert([newPost])
      .select();

    if (error) {
      throw error;
    }

    console.log("New blog post created successfully:", data);
    
    // Create an admin notification about the new post
    await supabaseClient
      .from("admin_notifications")
      .insert([{
        type: "blog_post_created",
        message: `New blog post "${newPost.title}" was automatically generated.`,
        data: { post_id: data?.[0]?.id }
      }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Blog post created successfully", 
        post: data?.[0] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating blog post:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
