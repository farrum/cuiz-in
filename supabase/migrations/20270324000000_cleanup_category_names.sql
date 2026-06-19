-- Standardize and merge category names to resolve category fragmentation
UPDATE quiz_questions SET category = 'Science & Nature' WHERE category = 'Science &amp; Nature';
UPDATE quiz_questions SET category = 'Science & Technology' WHERE category = 'Science and Technology';
UPDATE quiz_questions SET category = 'Arts & Literature' WHERE category = 'Arts and Literature';
UPDATE quiz_questions SET category = 'Food & Drink' WHERE category = 'Food and Drinks';
UPDATE quiz_questions SET category = 'Entertainment: Cartoon & Animations' WHERE category = 'Entertainment: Cartoon &amp; Animations';
UPDATE quiz_questions SET category = 'Entertainment: Japanese Anime & Manga' WHERE category = 'Entertainment: Japanese Anime &amp; Manga';
UPDATE quiz_questions SET category = 'Entertainment: Musicals & Theatres' WHERE category = 'Entertainment: Musicals &amp; Theatres';
