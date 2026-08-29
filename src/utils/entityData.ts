export type EntityType = 'person' | 'place' | 'event' | 'concept';

export interface EntityMetadata {
  slug: string;
  type: EntityType;
  name: string;
  category: string;
  summary: string;
  roleOrDesignation?: string;
  eraOrPeriod?: string;
  keyFacts: { label: string; value: string }[];
  sameAs: string[];
  keywords: string[];
  relatedEntitySlugs: string[];
  sources: { title: string; url: string }[];
}

export const ENTITY_REGISTRY: EntityMetadata[] = [
  // --- PEOPLE ---
  {
    slug: 'jawaharlal-nehru',
    type: 'person',
    name: 'Jawaharlal Nehru',
    category: 'History',
    roleOrDesignation: 'First Prime Minister of India (1947–1964)',
    eraOrPeriod: 'Modern Indian History (1889–1964)',
    summary: 'Jawaharlal Nehru was an Indian anti-colonial nationalist, secular humanist, social democrat, and statesman who served as the first Prime Minister of India from 1947 until his death in 1964. He was a central figure in Indian politics before and after independence and author of "The Discovery of India".',
    keyFacts: [
      { label: 'Born', value: 'November 14, 1889, Allahabad (Prayagraj), India' },
      { label: 'Died', value: 'May 27, 1964, New Delhi, India' },
      { label: 'Office', value: 'Prime Minister of India (15 August 1947 – 27 May 1964)' },
      { label: 'Key Works', value: 'The Discovery of India, Glimpses of World History' },
      { label: 'Movement', value: 'Indian Independence Movement, Non-Aligned Movement (NAM)' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Jawaharlal_Nehru',
      'https://www.wikidata.org/wiki/Q1047',
      'https://www.britannica.com/biography/Jawaharlal-Nehru',
      'https://www.india.gov.in'
    ],
    keywords: ['nehru', 'jawaharlal', 'discovery of india', 'first prime minister', 'tryst with destiny', 'chacha nehru', 'shanti van'],
    relatedEntitySlugs: ['mahatma-gandhi', 'indian-independence-movement', 'quit-india-movement'],
    sources: [
      { title: 'National Archives of India — Nehru Papers', url: 'http://nationalarchives.nic.in' },
      { title: 'Prime Ministers Museum & Library (PMML)', url: 'https://pmml.nic.in' }
    ]
  },
  {
    slug: 'mahatma-gandhi',
    type: 'person',
    name: 'Mahatma Gandhi',
    category: 'History',
    roleOrDesignation: 'Leader of the Indian Independence Movement',
    eraOrPeriod: 'Modern Indian History (1869–1948)',
    summary: 'Mohandas Karamchand Gandhi was an Indian lawyer, anti-colonial nationalist, and political ethicist who employed nonviolent resistance to lead the successful campaign for India\'s independence from British rule, inspiring movements for civil rights and freedom worldwide.',
    keyFacts: [
      { label: 'Born', value: 'October 2, 1869, Porbandar, Gujarat, India' },
      { label: 'Died', value: 'January 30, 1948, New Delhi, India' },
      { label: 'Philosophy', value: 'Satyagraha (Truth-force), Ahimsa (Nonviolence)' },
      { label: 'Major Campaigns', value: 'Non-Cooperation (1920), Salt March (1930), Quit India (1942)' },
      { label: 'Autobiography', value: 'The Story of My Experiments with Truth' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Mahatma_Gandhi',
      'https://www.wikidata.org/wiki/Q1001',
      'https://www.britannica.com/biography/Mahatma-Gandhi'
    ],
    keywords: ['gandhi', 'mahatma', 'bapu', 'satyagraha', 'ahimsa', 'salt march', 'dandi march', 'experiments with truth', 'sabarmati'],
    relatedEntitySlugs: ['jawaharlal-nehru', 'indian-independence-movement', 'quit-india-movement'],
    sources: [
      { title: 'Gandhi Heritage Portal', url: 'https://www.gandhiheritageportal.org' },
      { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' }
    ]
  },
  {
    slug: 'albert-einstein',
    type: 'person',
    name: 'Albert Einstein',
    category: 'Science',
    roleOrDesignation: 'Theoretical Physicist & Nobel Laureate',
    eraOrPeriod: '20th Century Physics (1879–1955)',
    summary: 'Albert Einstein was a German-born theoretical physicist widely acknowledged to be one of the greatest and most influential physicists of all time. He is best known for developing the theory of relativity and his mass–energy equivalence formula E = mc².',
    keyFacts: [
      { label: 'Born', value: 'March 14, 1879, Ulm, Germany' },
      { label: 'Died', value: 'April 18, 1955, Princeton, New Jersey, USA' },
      { label: 'Nobel Prize', value: 'Physics (1921) for the Photoelectric Effect' },
      { label: 'Core Theories', value: 'Special Relativity, General Relativity, Photoelectric Effect' },
      { label: 'Equation', value: 'E = mc²' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Albert_Einstein',
      'https://www.wikidata.org/wiki/Q937',
      'https://www.britannica.com/biography/Albert-Einstein'
    ],
    keywords: ['einstein', 'relativity', 'photoelectric', 'emc2', 'mass energy', 'princeton', 'brownian motion'],
    relatedEntitySlugs: ['theory-of-relativity', 'quantum-mechanics', 'marie-curie'],
    sources: [
      { title: 'Nobel Prize Official Archives — Albert Einstein', url: 'https://www.nobelprize.org/prizes/physics/1921/einstein/biographical/' },
      { title: 'Institute for Advanced Study', url: 'https://www.ias.edu' }
    ]
  },
  {
    slug: 'marie-curie',
    type: 'person',
    name: 'Marie Curie',
    category: 'Science',
    roleOrDesignation: 'Physicist & Chemist, Double Nobel Laureate',
    eraOrPeriod: 'Late 19th & Early 20th Century (1867–1934)',
    summary: 'Marie Skłodowska-Curie was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize, the first person to win twice, and the only person to win in two scientific fields (Physics and Chemistry).',
    keyFacts: [
      { label: 'Born', value: 'November 7, 1867, Warsaw, Poland' },
      { label: 'Died', value: 'July 4, 1934, Passy, France' },
      { label: 'Nobel Prizes', value: 'Physics (1903), Chemistry (1911)' },
      { label: 'Discovered Elements', value: 'Polonium (Po), Radium (Ra)' },
      { label: 'Term Coined', value: 'Radioactivity' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Marie_Curie',
      'https://www.wikidata.org/wiki/Q7186',
      'https://www.britannica.com/biography/Marie-Curie'
    ],
    keywords: ['curie', 'marie curie', 'radium', 'polonium', 'radioactivity', 'nobel physics chemistry'],
    relatedEntitySlugs: ['albert-einstein', 'quantum-mechanics'],
    sources: [
      { title: 'Nobel Prize Official Archives — Marie Curie', url: 'https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/' }
    ]
  },
  {
    slug: 'apj-abdul-kalam',
    type: 'person',
    name: 'A. P. J. Abdul Kalam',
    category: 'Science',
    roleOrDesignation: '11th President of India & Aerospace Scientist',
    eraOrPeriod: 'Modern India (1931–2015)',
    summary: 'Avul Pakir Jainulabdeen Abdul Kalam was an Indian aerospace scientist and statesman who served as the 11th President of India from 2002 to 2007. Known affectionately as the "Missile Man of India" for his work on ballistic missile and launch vehicle technology.',
    keyFacts: [
      { label: 'Born', value: 'October 15, 1931, Rameswaram, Tamil Nadu, India' },
      { label: 'Died', value: 'July 27, 2015, Shillong, Meghalaya, India' },
      { label: 'Moniker', value: 'Missile Man of India / People\'s President' },
      { label: 'Key Projects', value: 'SLV-III, Agni & Prithvi Missiles, Pokhran-II' },
      { label: 'Notable Books', value: 'Wings of Fire, Ignited Minds, India 2020' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/A._P._J._Abdul_Kalam',
      'https://www.wikidata.org/wiki/Q9513',
      'https://www.britannica.com/biography/A-P-J-Abdul-Kalam'
    ],
    keywords: ['kalam', 'abdul kalam', 'missile man', 'wings of fire', 'pokhran', 'slv', 'ignited minds'],
    relatedEntitySlugs: ['jawaharlal-nehru', 'solar-system'],
    sources: [
      { title: 'ISRO Official History & Pioneers', url: 'https://www.isro.gov.in' },
      { title: 'President of India Official Archives', url: 'https://presidentofindia.gov.in' }
    ]
  },
  {
    slug: 'sachin-tendulkar',
    type: 'person',
    name: 'Sachin Tendulkar',
    category: 'Sports',
    roleOrDesignation: 'Legendary Indian International Cricketer',
    eraOrPeriod: 'Contemporary Sports (1973–present)',
    summary: 'Sachin Ramesh Tendulkar is an Indian former international cricketer who captained the Indian national team. Widely regarded as one of the greatest batsmen in the history of cricket, he is the all-time highest run-scorer in both Test and ODI formats with 100 international centuries.',
    keyFacts: [
      { label: 'Born', value: 'April 24, 1973, Mumbai, India' },
      { label: 'International Centuries', value: '100 (51 Test, 49 ODI)' },
      { label: 'Total International Runs', value: '34,357 Runs' },
      { label: 'World Cup Title', value: '2011 ICC Cricket World Cup' },
      { label: 'Honours', value: 'Bharat Ratna (2014) — Highest Civilian Award' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Sachin_Tendulkar',
      'https://www.wikidata.org/wiki/Q9448',
      'https://www.espncricinfo.com/cricketers/sachin-tendulkar-35320'
    ],
    keywords: ['tendulkar', 'sachin', 'master blaster', '100 centuries', 'wankhede', 'bharat ratna cricket', '2011 world cup'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'Board of Control for Cricket in India (BCCI)', url: 'https://www.bcci.tv' },
      { title: 'International Cricket Council (ICC)', url: 'https://www.icc-cricket.com' }
    ]
  },
  {
    slug: 'william-shakespeare',
    type: 'person',
    name: 'William Shakespeare',
    category: 'Literature & Arts',
    roleOrDesignation: 'Playwright, Poet, & National Bard of England',
    eraOrPeriod: 'Elizabethan & Jacobean Era (1564–1616)',
    summary: 'William Shakespeare was an English playwright, poet and actor widely regarded as the greatest writer in the English language and the world\'s pre-eminent dramatist. His extant works include approximately 39 plays, 154 sonnets, and two long narrative poems.',
    keyFacts: [
      { label: 'Born', value: 'April 1564, Stratford-upon-Avon, England' },
      { label: 'Died', value: 'April 23, 1616, Stratford-upon-Avon, England' },
      { label: 'Famous Tragedies', value: 'Hamlet, Macbeth, Othello, King Lear, Romeo and Juliet' },
      { label: 'Famous Comedies', value: 'A Midsummer Night\'s Dream, The Merchant of Venice, Twelfth Night' },
      { label: 'Theatre', value: 'Globe Theatre, London' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/William_Shakespeare',
      'https://www.wikidata.org/wiki/Q692',
      'https://www.britannica.com/biography/William-Shakespeare'
    ],
    keywords: ['shakespeare', 'bard of avon', 'hamlet', 'macbeth', 'romeo and juliet', 'othello', 'sonnet', 'globe theatre'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'Folger Shakespeare Library', url: 'https://www.folger.edu' },
      { title: 'British Library Shakespeare Archives', url: 'https://www.bl.uk' }
    ]
  },

  // --- PLACES ---
  {
    slug: 'taj-mahal',
    type: 'place',
    name: 'Taj Mahal',
    category: 'Geography',
    roleOrDesignation: 'UNESCO World Heritage Site & Mughal Monument',
    eraOrPeriod: 'Mughal Empire (1632–1653 CE)',
    summary: 'The Taj Mahal is an ivory-white marble mausoleum on the south bank of the Yamuna river in the Indian city of Agra. It was commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal; it also houses the tomb of Shah Jahan himself.',
    keyFacts: [
      { label: 'Location', value: 'Agra, Uttar Pradesh, India' },
      { label: 'Builder', value: 'Mughal Emperor Shah Jahan' },
      { label: 'Architectural Style', value: 'Mughal Architecture (Persian, Islamic, and Indian elements)' },
      { label: 'UNESCO Designation', value: 'World Heritage Site (1983)' },
      { label: 'Material', value: 'Makrana White Marble with Pietra Dura Inlays' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Taj_Mahal',
      'https://www.wikidata.org/wiki/Q9141',
      'https://whc.unesco.org/en/list/252'
    ],
    keywords: ['taj mahal', 'shah jahan', 'mumtaz mahal', 'agra', 'yamuna', 'makrana marble', 'mughal architecture', 'wonder of the world'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'Archaeological Survey of India (ASI) — Taj Mahal', url: 'https://asi.nic.in' },
      { title: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org' }
    ]
  },
  {
    slug: 'mount-everest',
    type: 'place',
    name: 'Mount Everest',
    category: 'Geography',
    roleOrDesignation: 'Highest Mountain Peak on Earth',
    eraOrPeriod: 'Geological Formation (Himalayas)',
    summary: 'Mount Everest is Earth\'s highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas. The China–Nepal border runs across its summit point. Its elevation of 8,848.86 m (29,031.7 ft) was officially established in 2020 by Nepali and Chinese authorities.',
    keyFacts: [
      { label: 'Elevation', value: '8,848.86 metres (29,031.7 ft)' },
      { label: 'Location', value: 'Himalayas, Border of Nepal and China (Tibet)' },
      { label: 'First Ascent', value: 'Edmund Hillary and Tenzing Norgay (May 29, 1953)' },
      { label: 'Nepali Name', value: 'Sagarmatha ("Goddess of the Sky")' },
      { label: 'Tibetan Name', value: 'Chomolungma ("Holy Mother")' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Mount_Everest',
      'https://www.wikidata.org/wiki/Q513',
      'https://www.britannica.com/place/Mount-Everest'
    ],
    keywords: ['everest', 'mount everest', 'sagarmatha', 'chomolungma', 'hillary', 'tenzing norgay', 'highest peak', '8848'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'Survey of India', url: 'https://www.surveyofindia.gov.in' },
      { title: 'Royal Geographical Society', url: 'https://www.rgs.org' }
    ]
  },
  {
    slug: 'amazon-river',
    type: 'place',
    name: 'Amazon River',
    category: 'Geography',
    roleOrDesignation: 'Largest River by Water Discharge in the World',
    eraOrPeriod: 'Physical Geography (South America)',
    summary: 'The Amazon River in South America is the largest river by discharge volume of water in the world, and the second longest river system. It flows through Peru, Colombia, and Brazil, discharging into the Atlantic Ocean with an average discharge of about 209,000 m³/s.',
    keyFacts: [
      { label: 'Continents/Regions', value: 'South America (Amazon Basin)' },
      { label: 'Primary Countries', value: 'Brazil, Peru, Colombia, Bolivia, Ecuador' },
      { label: 'Outflow', value: 'Atlantic Ocean' },
      { label: 'Water Discharge', value: 'Approximately 20% of global river discharge' },
      { label: 'Ecosystem', value: 'Amazon Rainforest (Highest biodiversity on Earth)' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Amazon_River',
      'https://www.wikidata.org/wiki/Q3783',
      'https://www.britannica.com/place/Amazon-River'
    ],
    keywords: ['amazon river', 'amazon rainforest', 'largest river', 'brazil river', 'south america water', 'atlantic ocean discharge'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'National Geographic Resource Library', url: 'https://www.nationalgeographic.org' }
    ]
  },

  // --- EVENTS ---
  {
    slug: 'indian-independence-movement',
    type: 'event',
    name: 'Indian Independence Movement',
    category: 'History',
    roleOrDesignation: 'Anti-Colonial Liberation Struggle (1857–1947)',
    eraOrPeriod: 'Modern Era (1857–1947)',
    summary: 'The Indian Independence Movement was a series of historic events and struggles with the ultimate aim of ending British colonial rule in India. Spanning from the Rebellion of 1857 to August 15, 1947, it encompassed both nonviolent civil resistance and armed revolutionary action.',
    keyFacts: [
      { label: 'Timeframe', value: '1857 (Sepoy Mutiny) – August 15, 1947 (Independence)' },
      { label: 'Key Leaders', value: 'Mahatma Gandhi, Jawaharlal Nehru, Sardar Patel, Subhas Chandra Bose, Bhagat Singh' },
      { label: 'Milestones', value: '1857 Revolt, 1905 Swadeshi, 1919 Jallianwala Bagh, 1930 Dandi March, 1942 Quit India' },
      { label: 'Outcome', value: 'Indian Independence Act 1947 & Birth of Sovereign India and Pakistan' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Indian_independence_movement',
      'https://www.wikidata.org/wiki/Q124317',
      'https://www.britannica.com/event/Indian-mutiny'
    ],
    keywords: ['indian independence', 'freedom struggle', 'swaraj', 'satyagraha', '1947', 'british raj', '15 august 1947'],
    relatedEntitySlugs: ['mahatma-gandhi', 'jawaharlal-nehru', 'quit-india-movement'],
    sources: [
      { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' },
      { title: 'National Portal of India', url: 'https://www.india.gov.in' }
    ]
  },
  {
    slug: 'quit-india-movement',
    type: 'event',
    name: 'Quit India Movement',
    category: 'History',
    roleOrDesignation: 'All-India Mass Civil Disobedience Campaign (1942)',
    eraOrPeriod: 'World War II Era (August 1942)',
    summary: 'The Quit India Movement, also known as the August Kranti, was launched at the Bombay session of the All India Congress Committee by Mahatma Gandhi on 8 August 1942, demanding an end to British rule in India with the famous clarion call "Do or Die" (Karo ya Maro).',
    keyFacts: [
      { label: 'Date Launched', value: 'August 8, 1942' },
      { label: 'Venue', value: 'Gowalia Tank Maidan (August Kranti Maidan), Bombay (Mumbai)' },
      { label: 'Famous Slogan', value: '"Do or Die" (Karo ya Maro)' },
      { label: 'Leader', value: 'Mahatma Gandhi & Indian National Congress' },
      { label: 'Historical Context', value: 'Failure of the Cripps Mission during World War II' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Quit_India_Movement',
      'https://www.wikidata.org/wiki/Q1333333'
    ],
    keywords: ['quit india', 'august kranti', 'do or die', 'karo ya maro', 'gowalia tank', '1942 movement', 'cripps mission'],
    relatedEntitySlugs: ['mahatma-gandhi', 'jawaharlal-nehru', 'indian-independence-movement'],
    sources: [
      { title: 'National Archives of India — Quit India Papers', url: 'http://nationalarchives.nic.in' }
    ]
  },
  {
    slug: 'world-war-ii',
    type: 'event',
    name: 'World War II',
    category: 'History',
    roleOrDesignation: 'Global Conflict (1939–1945)',
    eraOrPeriod: '20th Century (1939–1945)',
    summary: 'World War II was a global conflict that lasted from 1939 to 1945. It involved the vast majority of the world\'s countries—including all the great powers—forming two opposing military alliances: the Allies and the Axis powers.',
    keyFacts: [
      { label: 'Duration', value: '1 September 1939 – 2 September 1945' },
      { label: 'Allied Powers', value: 'United States, Soviet Union, United Kingdom, France, China' },
      { label: 'Axis Powers', value: 'Nazi Germany, Imperial Japan, Kingdom of Italy' },
      { label: 'Key Milestones', value: 'Battle of Stalingrad, D-Day Normandy, Pearl Harbor, Hiroshima & Nagasaki' },
      { label: 'Outcome', value: 'Allied Victory, Formation of United Nations (UN), Beginning of Cold War' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/World_War_II',
      'https://www.wikidata.org/wiki/Q362',
      'https://www.britannica.com/event/World-War-II'
    ],
    keywords: ['world war ii', 'wwii', 'second world war', 'axis allies', 'hitler', 'pearl harbor', 'd-day', 'stalingrad', '1939 1945'],
    relatedEntitySlugs: ['albert-einstein'],
    sources: [
      { title: 'United States National Archives — WWII', url: 'https://www.archives.gov' },
      { title: 'Imperial War Museums', url: 'https://www.iwm.org.uk' }
    ]
  },

  // --- CONCEPTS ---
  {
    slug: 'theory-of-relativity',
    type: 'concept',
    name: 'Theory of Relativity',
    category: 'Science',
    roleOrDesignation: 'Pillar of Modern Physics',
    eraOrPeriod: 'Developed 1905 (Special) and 1915 (General)',
    summary: 'The theory of relativity usually encompasses two interrelated physics theories by Albert Einstein: special relativity and general relativity. Special relativity applies to all physical phenomena in the absence of gravity; general relativity explains the law of gravitation and its relation to the spacetime continuum.',
    keyFacts: [
      { label: 'Proponent', value: 'Albert Einstein' },
      { label: 'Components', value: 'Special Relativity (1905), General Relativity (1915)' },
      { label: 'Core Principles', value: 'Constancy of the speed of light, Spacetime curvature, Mass-energy equivalence' },
      { label: 'Key Predictions', value: 'Gravitational lensing, Time dilation, Black holes, Gravitational waves' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Theory_of_relativity',
      'https://www.wikidata.org/wiki/Q43514',
      'https://www.britannica.com/science/relativity'
    ],
    keywords: ['theory of relativity', 'special relativity', 'general relativity', 'spacetime', 'time dilation', 'gravitational wave', 'einstein theory'],
    relatedEntitySlugs: ['albert-einstein', 'quantum-mechanics'],
    sources: [
      { title: 'Max Planck Institute for Gravitational Physics', url: 'https://www.aei.mpg.de' },
      { title: 'Stanford Encyclopedia of Philosophy — Space and Time: Inertial Frames', url: 'https://plato.stanford.edu' }
    ]
  },
  {
    slug: 'quantum-mechanics',
    type: 'concept',
    name: 'Quantum Mechanics',
    category: 'Science',
    roleOrDesignation: 'Fundamental Theory in Physics',
    eraOrPeriod: 'Early 20th Century to Present',
    summary: 'Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.',
    keyFacts: [
      { label: 'Key Pioneers', value: 'Max Planck, Albert Einstein, Niels Bohr, Werner Heisenberg, Erwin Schrödinger' },
      { label: 'Core Principles', value: 'Wave-particle duality, Uncertainty principle, Quantum superposition, Entanglement' },
      { label: 'Famous Equation', value: 'Schrödinger Equation' },
      { label: 'Modern Applications', value: 'Semiconductors, Lasers, MRI scanners, Quantum Computing' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Quantum_mechanics',
      'https://www.wikidata.org/wiki/Q944',
      'https://www.britannica.com/science/quantum-mechanics-physics'
    ],
    keywords: ['quantum mechanics', 'quantum physics', 'schrodinger', 'heisenberg uncertainty', 'planck constant', 'superposition', 'wave particle duality'],
    relatedEntitySlugs: ['albert-einstein', 'theory-of-relativity', 'marie-curie'],
    sources: [
      { title: 'CERN Quantum Technology Initiative', url: 'https://quantum.cern' }
    ]
  },
  {
    slug: 'photosynthesis',
    type: 'concept',
    name: 'Photosynthesis',
    category: 'Science',
    roleOrDesignation: 'Biological Energy Conversion Process',
    eraOrPeriod: 'Fundamental Biochemical Process',
    summary: 'Photosynthesis is a biological process used by plants, algae, and certain bacteria to convert light energy into chemical energy, creating sugars like glucose from water and carbon dioxide while releasing oxygen as a byproduct.',
    keyFacts: [
      { label: 'Chemical Equation', value: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂' },
      { label: 'Key Pigment', value: 'Chlorophyll (absorbs blue and red light, reflects green)' },
      { label: 'Site of Reaction', value: 'Chloroplasts (Thylakoids and Stroma)' },
      { label: 'Two Stages', value: 'Light-dependent reactions & Light-independent reactions (Calvin cycle)' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Photosynthesis',
      'https://www.wikidata.org/wiki/Q11990',
      'https://www.britannica.com/science/photosynthesis'
    ],
    keywords: ['photosynthesis', 'chlorophyll', 'chloroplast', 'calvin cycle', 'glucose plant', 'oxygen production plant'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'National Geographic Resource Library — Photosynthesis', url: 'https://www.nationalgeographic.org' }
    ]
  },
  {
    slug: 'solar-system',
    type: 'concept',
    name: 'Solar System',
    category: 'Science',
    roleOrDesignation: 'Gravitationally Bound Planetary System of the Sun',
    eraOrPeriod: 'Formed 4.6 Billion Years Ago',
    summary: 'The Solar System is the gravitationally bound system of the Sun and the objects that orbit it. It formed 4.6 billion years ago from the gravitational collapse of a giant interstellar molecular cloud, comprising 8 major planets, dwarf planets, moons, asteroids, and comets.',
    keyFacts: [
      { label: 'Central Star', value: 'The Sun (99.86% of system\'s total mass)' },
      { label: 'Terrestrial Planets', value: 'Mercury, Venus, Earth, Mars' },
      { label: 'Gas & Ice Giants', value: 'Jupiter, Saturn, Uranus, Neptune' },
      { label: 'Age', value: 'Approximately 4.6 billion years' },
      { label: 'Outer Boundary', value: 'Oort Cloud & Kuiper Belt' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Solar_System',
      'https://www.wikidata.org/wiki/Q544',
      'https://solarsystem.nasa.gov'
    ],
    keywords: ['solar system', 'planets in solar system', 'sun mercury venus earth mars jupiter saturn uranus neptune', 'kuiper belt', 'oort cloud'],
    relatedEntitySlugs: [],
    sources: [
      { title: 'NASA Solar System Exploration', url: 'https://solarsystem.nasa.gov' }
    ]
  }
];

export function getEntityBySlug(slug: string): EntityMetadata | undefined {
  return ENTITY_REGISTRY.find(e => e.slug.toLowerCase() === slug.toLowerCase());
}

export function getEntitiesByType(type: EntityType): EntityMetadata[] {
  return ENTITY_REGISTRY.filter(e => e.type === type);
}

export function findMatchingEntityForQuestion(questionText: string): EntityMetadata | undefined {
  if (!questionText) return undefined;
  const lower = questionText.toLowerCase();
  
  for (const entity of ENTITY_REGISTRY) {
    if (entity.keywords.some(kw => lower.includes(kw))) {
      return entity;
    }
  }
  return undefined;
}
