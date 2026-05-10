const fs = require('fs');
const path = require('path');

const categories = ['Science & Nature', 'History & Culture', 'Geography', 'Technology', 'Tips & Strategy'];

const titles = [
  "The Fascinating World of Quantum Physics", "Ancient Civilizations That Shaped Our World", "Geographic Wonders of the Southern Hemisphere", 
  "The Evolution of Artificial Intelligence", "How to Boost Your Memory for Quiz Games", "Mysteries of the Deep Ocean Explored",
  "The Rise and Fall of the Roman Empire", "Top 10 Most Extreme Climates on Earth", "The History of Computing: From Turing to Today",
  "Strategies for Maintaining Your Daily Quiz Streak", "Understanding the Human Immune System", "The Renaissance: Art, Science, and Culture",
  "Navigating the World's Longest Rivers", "Space Exploration: Next Steps for Humanity", "Psychological Tricks to Remember Trivia",
  "The Chemistry of Everyday Life", "World War II: Key Turning Points", "Volcanoes: Earth's Most Powerful Force",
  "The Future of Renewable Energy Technologies", "Maximizing Points in Timed Quiz Challenges", "Genetics and the Blueprint of Life",
  "The Golden Age of Piracy", "Hidden Gems: Countries You Need to Know", "Cybersecurity in the Modern Age",
  "The Science of Active Recall and Learning", "Meteorology: Predicting the Unpredictable", "The Industrial Revolution's Global Impact",
  "Exploring the Seven Summits", "Blockchain and the Future of Finance", "How Gamification Enhances Education"
];

const intros = {
  'Science & Nature': [
    "Science is the systematic enterprise that builds and organizes knowledge in the form of testable explanations and predictions about the universe. Our understanding of the natural world is constantly evolving, driven by curiosity and rigorous methodology.",
    "The natural world is full of wonders that often defy our initial understanding. From the microscopic building blocks of life to the vast expanse of the cosmos, nature operates on principles that are both complex and beautifully elegant."
  ],
  'History & Culture': [
    "History is not just a series of dates and events; it is the narrative of human experience. By studying our past, we gain invaluable context for our present circumstances and a clearer vision for our future.",
    "Cultural evolution has shaped the societies we live in today. The beliefs, arts, and institutions of our ancestors have laid the groundwork for modern civilization, leaving an indelible mark on human progress."
  ],
  'Geography': [
    "Geography is the study of places and the relationships between people and their environments. It helps us understand the physical properties of the earth's surface and the human societies spread across it.",
    "Our planet is a diverse tapestry of landscapes, climates, and ecosystems. Understanding geography is crucial for comprehending the interconnectedness of global phenomena and the spatial distribution of resources."
  ],
  'Technology': [
    "Technology has been the primary driver of human advancement since the invention of the wheel. Today, the pace of technological change is accelerating, fundamentally transforming how we live, work, and communicate.",
    "In the digital age, understanding technology is no longer optional. The tools and systems we build reflect our highest aspirations and pose profound questions about the future of society."
  ],
  'Tips & Strategy': [
    "Success in competitive knowledge environments requires more than just raw intelligence; it requires strategy. Learning how to learn is perhaps the most valuable skill one can cultivate in the information age.",
    "Whether you are preparing for exams or competing in trivia challenges, the right methodology can significantly enhance your performance. Cognitive science offers practical techniques to optimize information retention."
  ]
};

const bodies = {
  'Science & Nature': [
    "<h2>The Building Blocks</h2><p>At the most fundamental level, matter is composed of atoms and subatomic particles. The intricate dance of these particles governs the chemical reactions that sustain life and power the stars. Quantum mechanics has revealed a reality that often contradicts common sense, where probabilities replace certainties and observation alters outcomes.</p>",
    "<h2>Ecosystems and Biodiversity</h2><p>Earth's biosphere is characterized by a staggering variety of life forms interacting within complex ecosystems. Biodiversity is not just an aesthetic luxury; it is crucial for ecological resilience. Every species plays a role in the intricate web of life, contributing to nutrient cycling, pollination, and climate regulation.</p>",
    "<h2>The Cosmos</h2><p>Astronomy has expanded our horizon far beyond the solar system. We now know that our galaxy is just one of billions, each containing billions of stars. The discovery of exoplanets has ignited the search for extraterrestrial life, while astrophysics continues to probe the mysteries of dark matter and dark energy that dominate the universe's mass-energy budget.</p>"
  ],
  'History & Culture': [
    "<h2>Turning Points</h2><p>Certain historical periods serve as crucibles of change. The Renaissance, the Industrial Revolution, and the Information Age represent paradigm shifts that redefined human capability and societal structure. These eras were marked by rapid innovation, cultural flourishing, and often, significant social upheaval.</p>",
    "<h2>The Role of Leadership</h2><p>Throughout history, individual leaders have exerted disproportionate influence on the course of events. From visionary reformers to tyrannical conquerors, leadership has shaped empires, dictated borders, and influenced the cultural zeitgeist. Analyzing these figures provides insight into the dynamics of power and governance.</p>",
    "<h2>Cultural Legacy</h2><p>The artifacts, literature, and architectural marvels left by past civilizations are the primary sources of our historical knowledge. These cultural legacies provide a window into the daily lives, spiritual beliefs, and artistic achievements of our ancestors, reminding us of the enduring human desire to create and communicate.</p>"
  ],
  'Geography': [
    "<h2>Physical Landscapes</h2><p>The Earth's surface is constantly reshaped by tectonic activity, erosion, and climate. Mountains rise through the collision of continental plates, while rivers carve deep canyons over millennia. These physical features profoundly influence local climates, biodiversity, and human settlement patterns.</p>",
    "<h2>Human Geography</h2><p>The spatial distribution of human populations is closely tied to geographic factors. Access to water, fertile soil, and strategic trade routes has historically determined the rise of major cities and the success of nations. Today, urbanization and migration continue to reshape the demographic landscape.</p>",
    "<h2>Environmental Challenges</h2><p>Geographers are at the forefront of studying environmental challenges such as climate change, deforestation, and resource depletion. Understanding the spatial dimension of these issues is essential for developing sustainable solutions and mitigating the impacts on vulnerable communities and ecosystems.</p>"
  ],
  'Technology': [
    "<h2>The Digital Revolution</h2><p>The transition from analog to digital technology has revolutionized information processing and communication. The proliferation of the internet and mobile devices has created a globally connected society, democratizing access to knowledge while raising new challenges regarding privacy and digital equity.</p>",
    "<h2>Artificial Intelligence</h2><p>AI represents perhaps the most transformative technological frontier of the 21st century. Machine learning algorithms are increasingly capable of performing tasks that previously required human intelligence, from recognizing patterns in medical imagery to natural language processing. The societal implications of AI are profound and far-reaching.</p>",
    "<h2>Sustainable Innovation</h2><p>As the environmental impact of industrialization becomes apparent, technological innovation is increasingly focused on sustainability. Advances in renewable energy, energy storage, and green engineering are crucial for mitigating climate change and transitioning to a more resilient global economy.</p>"
  ],
  'Tips & Strategy': [
    "<h2>Spaced Repetition</h2><p>The forgetting curve demonstrates that we lose information rapidly if it is not reinforced. Spaced repetition is a learning technique that involves reviewing material at increasing intervals. This method leverages the psychological spacing effect to maximize long-term retention and is highly effective for memorizing facts and concepts.</p>",
    "<h2>Active Recall</h2><p>Reading passively is a notoriously inefficient study method. Active recall involves actively stimulating memory during the learning process. By forcing your brain to retrieve information without looking at the source, you strengthen the neural pathways associated with that knowledge, leading to deeper learning and better test performance.</p>",
    "<h2>Contextual Learning</h2><p>Information is more easily remembered when it is connected to a meaningful context. Rote memorization is often less effective than understanding the underlying principles and relationships between concepts. By building a conceptual framework, you can integrate new information more seamlessly and recall it more readily.</p>"
  ]
};

const conclusions = [
  "In conclusion, expanding our understanding of these topics not only satisfies our intellectual curiosity but also equips us to navigate an increasingly complex world.",
  "Ultimately, the pursuit of knowledge is a lifelong journey. By engaging with these concepts, we build a foundation for critical thinking and informed decision-making.",
  "As we continue to explore these fascinating subjects, we uncover the interconnectedness of all disciplines, enriching our perspective and enhancing our cognitive abilities."
];

// Generate dates starting from 6 months ago (Nov 2025) to today (May 2026)
const startDate = new Date('2025-11-01').getTime();
const endDate = new Date('2026-05-10').getTime();

function randomDate() {
  const date = new Date(startDate + Math.random() * (endDate - startDate));
  return date.toISOString().split('T')[0];
}

const authors = ['CuizIN Editorial', 'Dr. Trivia', 'Quiz Master', 'Knowledge Keeper', 'Sarah Scholar'];

const posts = [];

for (let i = 0; i < 30; i++) {
  const category = categories[i % categories.length];
  const title = titles[i];
  const date = randomDate();
  const author = authors[i % authors.length];
  
  const introList = intros[category];
  const intro = introList[i % introList.length];
  
  const bodyList = bodies[category];
  // select 3 distinct paragraphs for the body
  let shuffledBody = [...bodyList].sort(() => 0.5 - Math.random());
  
  const conc = conclusions[i % conclusions.length];
  
  const content = `
    <h2>Introduction</h2>
    <p>${intro}</p>
    ${shuffledBody[0]}
    ${shuffledBody[1]}
    ${shuffledBody[2]}
    <h2>Conclusion</h2>
    <p>${conc}</p>
  `;
  
  // Extract excerpt
  const excerpt = intro.substring(0, 120) + '...';
  const readTime = Math.floor(Math.random() * 4 + 4) + ' min read'; // 4-7 min
  
  // Slug
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  posts.push({
    id: i + 1,
    slug,
    title,
    excerpt,
    category,
    date,
    author,
    readTime,
    content
  });
}

// Sort posts by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Re-assign IDs based on sorted order
posts.forEach((p, i) => p.id = i + 1);

const fileContent = `// This file is auto-generated to provide rich text content for SEO
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  content: string;
}

export const blogPosts: BlogPost[] = ${JSON.stringify(posts, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'blogData.ts'), fileContent);
console.log('Successfully generated src/utils/blogData.ts');
