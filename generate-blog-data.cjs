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

// 2. Add 10 specific high-quality category blogs linking to real Supabase questions
const customBlogs = [
  {
    title: "The Mythology of Constellations: Greek Legends in the Night Sky",
    category: "Mythology",
    author: "Knowledge Keeper",
    date: "2026-06-15",
    readTime: "5 min read",
    excerpt: "Discover the mythological stories behind the constellations. Learn how ancient Greek legends of gods, goddesses, and heroes are immortalized in the night sky.",
    content: `
      <h2>Gods and Heroes in the Stars</h2>
      <p>For thousands of years, humans have looked up at the night sky and seen patterns in the stars. To the ancient Greeks, these constellations were not random groupings of burning gas; they were a canvas on which the legends of gods, goddesses, heroes, and beasts were painted for eternity.</p>
      <h2>The Legend of Athena and Her Owl</h2>
      <p>One of the most famous figures in these myths is the goddess of wisdom and battle strategy. Her presence was said to protect scholars, warriors, and the city of Athens itself. Learn more by trying our interactive trivia question: <a href="/quiz/question/8bbaca03-cd00-4273-89b7-1a5f2f03980a/mythology/this-greek-mythological-figure-is-the-godgoddess-of-battle-strategy-among-other-things">Which Greek mythological figure represents battle strategy and wisdom?</a></p>
      <h2>Immortalized in the Cosmos</h2>
      <p>From the tragic tale of Orion to the journeys of Perseus and Andromeda, the night sky is a living storybook. Understanding these stories connects us to our ancestors and adds depth to our stargazing adventures.</p>
      <h2>Conclusion</h2>
      <p>By studying the mythological origins of constellations, we keep ancient traditions alive. Test your knowledge across all mythologies on CuizIN and see how well you know the gods of old!</p>
    `
  },
  {
    title: "How Global Politics Shapes International Trade Agreements",
    category: "Global Politics",
    author: "Sarah Scholar",
    date: "2026-06-18",
    readTime: "6 min read",
    excerpt: "Understand the intricate connection between global politics and international trade. Explore how government policies, elections, and treaties impact global economics.",
    content: `
      <h2>Politics and the Global Market</h2>
      <p>International trade is rarely just about economics. Behind every tariff, treaty, and trade agreement lies a complex web of political decisions, domestic pressures, and diplomatic negotiations. Governments use trade policies as tools of foreign relations, shaping alliances and projecting power on the world stage.</p>
      <h2>The Legacy of Leadership</h2>
      <p>Throughout history, individual leaders have set the tone for their nations' political and economic systems. Some are remembered for their striking presence, others for their policy reforms. Take a moment to challenge yourself: <a href="/quiz/question/2d682c80-4132-4c42-abca-0a40fd2f2b94/global-politics/which-us-president-is-said-to-have-had-the-longest-beard">Do you know which U.S. president had the longest beard?</a></p>
      <h2>The Modern Geopolitical Landscape</h2>
      <p>Today, trade conflicts and cooperative blocks show that the intersection of politics and economics is more critical than ever. As countries negotiate new partnerships, the balance of power shifts, affecting consumer goods and supply chains globally.</p>
      <h2>Conclusion</h2>
      <p>Staying informed about global politics helps us understand the factors driving international economics. Keep playing global politics quizzes on CuizIN to test your knowledge of international relations, government systems, and history!</p>
    `
  },
  {
    title: "The Evolution of World Music: From Folk to Global Beats",
    category: "World Music",
    author: "Dr. Trivia",
    date: "2026-06-20",
    readTime: "5 min read",
    excerpt: "Trace the evolution of world music as folk traditions merge with modern genres. Discover the instruments and artists that brought classical sounds to a global audience.",
    content: `
      <h2>Melodies Across Borders</h2>
      <p>World music is a bridge that connects diverse cultures. By combining local instruments and rhythms with contemporary production, musicians create a global language that transcends language barriers. From the folk songs of rural villages to the massive stages of international festivals, world music has evolved into a powerhouse of cultural exchange.</p>
      <h2>Sitar's Journey to the West</h2>
      <p>A key moment in this evolution was the popularization of classical Indian instruments in Western rock and pop during the 1960s. This cultural exchange introduced the mesmerizing sounds of the sitar to millions of new listeners. Test your knowledge: <a href="/quiz/question/d6c9c671-2a53-4ba5-8e01-c43f5cbdd686/music/which-indian-musician-is-credited-with-popularizing-the-sitar-in-western-music">Which Indian musician popularized the sitar in Western music?</a></p>
      <h2>The Rhythm of Identity</h2>
      <p>Every culture has a unique musical signature, but as genres mix, we see the rise of exciting new fusion styles. This evolution shows that while music is rooted in heritage, it is constantly growing and adapting.</p>
      <h2>Conclusion</h2>
      <p>Exploring world music expands our cultural awareness and appreciation for global art. Dive into the world music and entertainment quizzes on CuizIN to see how much you know about classical and modern musical traditions!</p>
    `
  },
  {
    title: "The Crucial Role of Law & Justice in Modern Democracies",
    category: "Law & Justice",
    author: "Sarah Scholar",
    date: "2026-06-22",
    readTime: "6 min read",
    excerpt: "Learn about the foundations of law and justice that protect individual rights and maintain order in democratic societies around the globe.",
    content: `
      <h2>The Pillars of Society</h2>
      <p>A functioning democracy relies on the rule of law to protect citizens, resolve disputes, and maintain order. The legal system ensures that power is not concentrated in the hands of a few and that justice is administered fairly and transparently. From ancient tablets to modern constitutions, the evolution of law is the story of human civilization striving for fairness.</p>
      <h2>Origins of Written Law</h2>
      <p>The history of written legal systems dates back thousands of years. Early codes laid the groundwork for modern concepts of accountability and justice. Try our trivia challenge to see if you know the origins: <a href="/quiz/question/af5798e0-bc02-4192-9418-b1af9869908e/law-justice/which-famous-historical-legal-code-is-one-of-the-oldest-deciphered-writings-of-significant-length-in-the-world">Which ancient legal code is among the oldest deciphered writings of length?</a></p>
      <h2>Justice in the Modern Era</h2>
      <p>As societies become more complex, legal systems must adapt to face new challenges such as digital privacy, global crime, and environmental law. The core principles of justice, however, remain unchanged: equality before the law and the protection of basic rights.</p>
      <h2>Conclusion</h2>
      <p>Understanding the law empowers citizens to participate effectively in democratic life. Test your legal literacy by taking the Law & Justice quizzes on CuizIN today!</p>
    `
  },
  {
    title: "Protecting Our Environment: The Battle Against Climate Change",
    category: "Environment",
    author: "CuizIN Editorial",
    date: "2026-06-24",
    readTime: "5 min read",
    excerpt: "Explore the ecological challenges facing our planet and the conservation efforts underway to protect vital ecosystems and combat climate change.",
    content: `
      <h2>The Global Ecological Crisis</h2>
      <p>Our planet's ecosystems are under unprecedented pressure from human activity. Deforestation, pollution, and greenhouse gas emissions are driving climate change, resulting in rising sea levels, extreme weather events, and habitat loss. Protecting the environment is no longer just about conservation; it is essential for the future of humanity.</p>
      <h2>Natural Coastal Protections</h2>
      <p>Among the most critical ecosystems are mangrove forests, which serve as natural barriers against storms and act as massive carbon sinks. One of the largest of these sits on the border of India and Bangladesh. Test your environmental trivia: <a href="/quiz/question/3a5dcc5e-82a6-4f00-9416-959f2a018f1a/environment-nature/which-is-the-largest-mangrove-forest-in-the-world-and-a-unesco-world-heritage-site-located-in-india-and-bangladesh">What is the largest mangrove forest in the world?</a></p>
      <h2>A Path Toward Sustainability</h2>
      <p>Combating climate change requires a global transition to renewable energy, sustainable agriculture, and circular economies. Every step counts, from individual lifestyle changes to international climate treaties.</p>
      <h2>Conclusion</h2>
      <p>Raising environmental awareness is a crucial step toward protecting our planet. Learn more about ecological science and sustainability by taking our Environment quizzes on CuizIN!</p>
    `
  },
  {
    title: "Smart Money: Key Principles of Business & Finance",
    category: "Business",
    author: "Quiz Master",
    date: "2026-06-25",
    readTime: "6 min read",
    excerpt: "Master the fundamental concepts of business, marketing, and finance to make informed decisions and understand global economic forces.",
    content: `
      <h2>Foundations of Commerce</h2>
      <p>Business and finance drive the modern world. Understanding how companies operate, how markets function, and how capital is allocated is essential for anyone looking to navigate the global economy. From microeconomics to multinational corporations, the principles of business guide how resources are turned into value.</p>
      <h2>The Father of Modern Marketing</h2>
      <p>To succeed in business, a company must connect with its customers. The strategies used to reach and retain clients were shaped by legendary theorists in the 20th century. Test your business IQ: <a href="/quiz/question/a70abfd1-5ae2-4cc0-b86f-d6a2764b88a1/business-finance/who-is-often-referred-to-as-the-father-of-modern-marketing">Who is considered the father of modern marketing?</a></p>
      <h2>Managing Risk and Capital</h2>
      <p>Financial literacy is key to personal and professional success. Learning how to manage risk, evaluate investment opportunities, and analyze market trends is crucial in an ever-changing economic landscape.</p>
      <h2>Conclusion</h2>
      <p>Developing business acumen is a lifelong asset. Challenge yourself and improve your financial knowledge by playing Business & Finance quizzes on CuizIN!</p>
    `
  },
  {
    title: "Fun Kids Trivia: Why Play is Essential for Learning",
    category: "Kids Corner",
    author: "Mascot Player",
    date: "2026-06-26",
    readTime: "4 min read",
    excerpt: "Discover why trivia and play are powerful tools for childhood development, helping children build memory, curiosity, and critical thinking.",
    content: `
      <h2>Learning Through Play</h2>
      <p>Children learn best when they are active participants in their education. Playful activities, puzzles, and trivia games stimulate cognitive development by encouraging curiosity and problem-solving. By turning facts into games, we help kids retain information and develop a lifelong love for learning.</p>
      <h2>Art Appreciation at an Early Age</h2>
      <p>Simple trivia questions about world history and art can spark a child's imagination. Asking children to identify famous paintings helps them develop visual literacy and historical context. Try a fun question: <a href="/quiz/question/2fb0db10-4c92-410c-9671-68a9568783c2/kids-trivia/who-painted-the-mona-lisa">Do you know who painted the Mona Lisa?</a></p>
      <h2>Boosting Confidence and Memory</h2>
      <p>When kids get a trivia question right, they experience a surge of confidence. Even when they make mistakes, they learn new information in a low-stakes, encouraging environment, which helps build cognitive resilience.</p>
      <h2>Conclusion</h2>
      <p>Trivia is a fantastic way to bond with children while boosting their cognitive skills. Head over to the Kids Corner category on CuizIN and play fun, kid-friendly quizzes together!</p>
    `
  },
  {
    title: "A Guide to Guinness World Records: Human Limits Explored",
    category: "Guinness World Records",
    author: "Knowledge Keeper",
    date: "2026-06-27",
    readTime: "5 min read",
    excerpt: "Explore the history of Guinness World Records and the science of human endurance. Discover how extreme record-breakers push the boundaries of capability.",
    content: `
      <h2>The Pursuit of the Extreme</h2>
      <p>For decades, Guinness World Records has documented the most extraordinary feats and achievements across the globe. From natural anomalies to triumphs of human endurance, these records showcase the extreme boundaries of what is possible. Behind many of these records lie years of training, dedication, and mental fortitude.</p>
      <h2>Testing Human Breath Limits</h2>
      <p>Some of the most spectacular records involve breath-holding underwater. This feat requires pushing the human body beyond its natural survival instincts through specialized breathing techniques. Test your knowledge on this record: <a href="/quiz/question/4e4c7ec4-97f4-4e72-89dc-3e09b84aefc1/guinness-world-records/what-is-the-longest-time-a-person-has-held-their-breath-underwater">What is the world record for holding breath underwater?</a></p>
      <h2>The Global Fascination with Records</h2>
      <p>Whether it is building the largest sandcastle or running the fastest marathon, people are driven to leave their mark. These records continue to capture our collective imagination, inspiring others to test their own limits.</p>
      <h2>Conclusion</h2>
      <p>Guinness World Records is a celebration of human uniqueness and determination. Explore our Guinness World Records quizzes on CuizIN to see how many amazing facts you can get right!</p>
    `
  },
  {
    title: "The Global Phenomenon of K-Pop and K-Drama Culture",
    category: "K-Pop & K-Drama",
    author: "Sarah Scholar",
    date: "2026-06-28",
    readTime: "5 min read",
    excerpt: "Analyze the global rise of the Korean Wave (Hallyu). Discover how K-Pop music and K-Dramas conquered the international entertainment industry.",
    content: `
      <h2>Hallyu: The Korean Wave</h2>
      <p>Over the last decade, South Korea has become a global cultural powerhouse. The rise of Hallyu, or the Korean Wave, has introduced audiences worldwide to K-Pop music, television series (K-Dramas), fashion, and food. Characterized by high-energy choreography, catchy hooks, and emotional storytelling, this cultural export has captured the hearts of millions.</p>
      <h2>Music That Unites the World</h2>
      <p>At the center of this movement are K-Pop groups and soloists who break streaming records and sell out arenas worldwide. While K-Pop is modern, it shares a legacy with classic pop and rock anthems that have historically united global audiences. Test your music knowledge: <a href="/quiz/question/eeb14730-4a95-41a4-845f-39e9bd8e372c/entertainment/music/which-band-is-famous-for-the-song-bohemian-rhapsody">Which legendary band sang Bohemian Rhapsody?</a></p>
      <h2>The Allure of Korean Drama</h2>
      <p>K-Dramas have also gained massive popularity due to their high production quality, complex characters, and unique storylines. From historical epics to modern romances, these dramas offer fresh perspectives for global viewers.</p>
      <h2>Conclusion</h2>
      <p>The Korean Wave continues to reshape international popular culture, fostering global connection through art. Dive into the K-Pop & K-Drama quizzes on CuizIN to test your knowledge of your favorite idols and shows!</p>
    `
  },
  {
    title: "Exploring Legendary Historical Figures and Their Unsolved Mysteries",
    category: "History",
    author: "Dr. Trivia",
    date: "2026-06-29",
    readTime: "6 min read",
    excerpt: "Step back in time to examine the lives of history's most powerful rulers and the architectural monuments they left behind.",
    content: `
      <h2>The Footprints of Empires</h2>
      <p>History is written by the powerful, but it is preserved in stone and stories. Rulers of ancient empires left behind monuments that continue to captivate modern scholars. Studying these figures reveals the ambitions, strategies, and cultural heights of past societies.</p>
      <h2>The Mughal Golden Age</h2>
      <p>A prime example of architectural and political legacy is the Mughal Empire, which built some of the world's most recognizable monuments, including the Taj Mahal. The ruler who commissioned this monument is remembered for his patronage of the arts. Test your history trivia: <a href="/quiz/question/6e24048a-ac08-4238-806d-c31ef6020b26/history/who-was-the-ruler-during-the-construction-of-the-taj-mahal">Who ruled during the construction of the Taj Mahal?</a></p>
      <h2>Unlocking the Past</h2>
      <p>Every archaeological discovery brings us closer to understanding the lives of historic leaders, their daily lives, and the social structures of the civilizations they led.</p>
      <h2>Conclusion</h2>
      <p>Delving into historical mysteries keeps us connected to the roots of human progress. Challenge yourself with History quizzes on CuizIN to see how well you know the stories of the past!</p>
    `
  }
];

// Append custom blogs
customBlogs.forEach((cb) => {
  const slug = cb.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  posts.push({
    slug,
    title: cb.title,
    excerpt: cb.excerpt,
    category: cb.category,
    date: cb.date,
    author: cb.author,
    readTime: cb.readTime,
    content: cb.content
  });
});

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
