// Curated, hand-verified GK questions for the pre-built /gk-quiz page.
// Static on purpose: answers must always be correct (never derived from option order).
const GK_QUESTIONS = [
  ['Who is known as the "Father of the Indian Constitution"?', 'Dr. B. R. Ambedkar', 'Ambedkar chaired the Drafting Committee of the Constituent Assembly, which prepared the Constitution adopted in 1949.', 'Indian Polity'],
  ['On which date did the Constitution of India come into force?', '26 January 1950', 'It was adopted on 26 November 1949 and came into force on 26 January 1950, celebrated as Republic Day.', 'Indian Polity'],
  ['Who was the first President of India?', 'Dr. Rajendra Prasad', 'Rajendra Prasad served from 1950 to 1962 and is the only President elected for two full terms.', 'Indian Polity'],
  ['Who was the first Prime Minister of independent India?', 'Jawaharlal Nehru', 'Nehru served from 1947 until his death in 1964, the longest tenure of any Indian Prime Minister.', 'Indian History'],
  ['In which year did the Jallianwala Bagh massacre take place?', '1919', 'On 13 April 1919, troops under General Dyer fired on a crowd in Amritsar, a turning point in the freedom struggle.', 'Indian History'],
  ['Which movement did Mahatma Gandhi launch in August 1942?', 'Quit India Movement', 'Gandhi gave the call "Do or Die" at the Bombay session of the Congress on 8 August 1942.', 'Indian History'],
  ['Which Mughal emperor built the Taj Mahal?', 'Shah Jahan', 'Shah Jahan built it in Agra in memory of his wife Mumtaz Mahal; it is a UNESCO World Heritage Site.', 'Indian History'],
  ['Who founded the Maurya Empire?', 'Chandragupta Maurya', 'Chandragupta founded the empire around 322 BCE with guidance from his adviser Chanakya.', 'Indian History'],
  ['What is the longest river in India?', 'Ganga', 'The Ganga flows about 2,525 km from the Gangotri Glacier to the Bay of Bengal.', 'Geography'],
  ['Which is the largest state of India by area?', 'Rajasthan', 'Rajasthan covers about 342,000 sq km, roughly 10% of India\'s land area.', 'Geography'],
  ['What is the highest mountain peak in the world?', 'Mount Everest', 'Everest stands at about 8,849 m on the Nepal–China border.', 'Geography'],
  ['Which is the largest ocean on Earth?', 'Pacific Ocean', 'The Pacific covers about a third of the Earth\'s surface — more than all land combined.', 'Geography'],
  ['What is the capital of Australia?', 'Canberra', 'Canberra was purpose-built as a compromise between rivals Sydney and Melbourne.', 'World Geography'],
  ['Which is the smallest country in the world by area?', 'Vatican City', 'Vatican City covers about 0.44 sq km and is located inside Rome, Italy.', 'World Geography'],
  ['What is the chemical symbol for gold?', 'Au', 'The symbol comes from the Latin word "aurum", meaning gold.', 'Science'],
  ['Which planet is known as the "Red Planet"?', 'Mars', 'Iron oxide (rust) on its surface gives Mars its reddish colour.', 'Science'],
  ['Which gas do plants absorb from the air for photosynthesis?', 'Carbon dioxide', 'Plants use carbon dioxide, water and sunlight to make glucose, releasing oxygen.', 'Science'],
  ['What is the powerhouse of the cell?', 'Mitochondria', 'Mitochondria produce most of the cell\'s energy in the form of ATP.', 'Science'],
  ['Which vitamin does the human body make when skin is exposed to sunlight?', 'Vitamin D', 'UVB rays help the skin produce vitamin D, which is essential for strong bones.', 'Science'],
  ['What is the SI unit of force?', 'Newton', 'One newton is the force that accelerates a 1 kg mass at 1 m/s².', 'Science'],
  ['Who proposed the theory of relativity?', 'Albert Einstein', 'Einstein published special relativity in 1905 and general relativity in 1915.', 'Science'],
  ['What was the name of India\'s first satellite?', 'Aryabhata', 'Aryabhata was launched on 19 April 1975 with help from the Soviet Union.', 'Science & Space'],
  ['Which Indian mission made India the first country to land near the Moon\'s south pole?', 'Chandrayaan-3', 'Chandrayaan-3\'s Vikram lander touched down on 23 August 2023, now marked as National Space Day.', 'Science & Space'],
  ['Who wrote India\'s national anthem "Jana Gana Mana"?', 'Rabindranath Tagore', 'Tagore also wrote Bangladesh\'s anthem and won the Nobel Prize in Literature in 1913.', 'Culture'],
  ['What is the national animal of India?', 'Bengal Tiger', 'The tiger was adopted as the national animal in 1973, the year Project Tiger began.', 'Culture'],
  ['Who wrote the play "Hamlet"?', 'William Shakespeare', 'Hamlet, written around 1600, is one of Shakespeare\'s best-known tragedies.', 'Literature'],
  ['Which country won the first ICC Cricket World Cup in 1975?', 'West Indies', 'West Indies beat Australia in the final at Lord\'s, led by Clive Lloyd.', 'Sports'],
  ['In which year did India win its first Cricket World Cup?', '1983', 'Kapil Dev\'s team beat West Indies at Lord\'s on 25 June 1983.', 'Sports'],
  ['How many players are there on a football team on the field?', '11', 'Each side fields 11 players, including the goalkeeper.', 'Sports'],
  ['Where is the headquarters of the United Nations?', 'New York City', 'The UN headquarters in Manhattan has served as its main seat since 1952.', 'World Affairs'],
];

const GK_FAQ = [
  ['What is a GK quiz?', 'A GK (general knowledge) quiz tests what you know about history, geography, science, polity, sports and current affairs. CuizIN quizzes are free and show an explanation after each answer.'],
  ['Are these GK questions useful for SSC, UPSC and banking exams?', 'Yes. The questions cover the static GK topics that appear often in SSC, UPSC prelims, railway and banking exams, such as Indian polity, history and basic science.'],
  ['Is the CuizIN GK quiz free?', 'Yes. You can play without paying. Guests can answer up to 30 questions a day; a free account removes that limit and saves your points and streaks.'],
  ['How many GK questions are on CuizIN?', 'This page shows 30 sample questions. The full General Knowledge category and related topics hold thousands more, with new questions added regularly.'],
  ['Can I play the GK quiz on my phone?', 'Yes. The site works in any mobile browser, and the CuizIN Android app is available on Google Play.'],
];

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function buildGkQuizBody() {
  const qs = GK_QUESTIONS.map(([q,a,e,t],i)=>`
      <li>
        <h3>${i+1}. ${esc(q)}</h3>
        <p><strong>Answer:</strong> ${esc(a)}</p>
        <p><em>Explanation:</em> ${esc(e)} <small>(${esc(t)})</small></p>
      </li>`).join('');
  const faq = GK_FAQ.map(([q,a])=>`
      <h3>${esc(q)}</h3>
      <p>${esc(a)}</p>`).join('');
  return `
      <h1>GK Quiz — General Knowledge Questions & Answers</h1>
      <p>Practice daily with bite-sized GK quizzes that mirror competitive exam formats like SSC, UPSC and banking. Below are ${GK_QUESTIONS.length} general knowledge questions with answers and short explanations covering Indian polity, history, geography, science, culture and sports.</p>
      <p><a href="/categories/general-knowledge"><strong>Start Playing GK Quiz &rarr;</strong></a></p>
      <h2>${GK_QUESTIONS.length} GK Questions with Answers</h2>
      <ol>${qs}
      </ol>
      <p>Want more? <a href="/categories/general-knowledge">Play the full General Knowledge quiz</a>, try <a href="/topics/indian-history">Indian History questions</a>, <a href="/topics/world-geography">World Geography questions</a> or <a href="/topics/science-technology">Science &amp; Technology questions</a>, or browse <a href="/gk-questions">more GK questions for competitive exams</a>.</p>
      <h2>Frequently Asked Questions</h2>${faq}
    `;
}

function buildGkQuizJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": GK_FAQ.map(([q,a])=>({ "@type":"Question", name:q, acceptedAnswer:{ "@type":"Answer", text:a } }))
  };
}

module.exports = { GK_QUESTIONS, GK_FAQ, buildGkQuizBody, buildGkQuizJsonLd };
