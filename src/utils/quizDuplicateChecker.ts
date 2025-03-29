
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/quizData';

/**
 * Checks for duplicate questions in the database based on similarity
 * @param question The question text to check
 * @returns Boolean indicating if a similar question already exists
 */
export async function checkForDuplicateQuestion(question: string): Promise<boolean> {
  try {
    // First do an exact match check
    const { data: exactMatches, error: exactError } = await supabase
      .from('quiz_questions')
      .select('question')
      .eq('question', question)
      .limit(1);

    if (exactError) {
      console.error('Error checking for exact duplicate questions:', exactError);
      return false;
    }

    // If we found an exact match, it's definitely a duplicate
    if (exactMatches && exactMatches.length > 0) {
      console.log('Found exact duplicate question:', question);
      return true;
    }

    // For a more sophisticated check, we could also look for similar questions
    // This is a simple implementation looking for significant word overlap
    const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    if (words.length < 3) {
      return false; // Too short to reliably check for similarity
    }

    // Create a query with ILIKE for each meaningful word in the question
    let query = supabase.from('quiz_questions').select('question');
    
    // Add ILIKE conditions for each significant word
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      if (words[i].length > 3) {
        query = query.ilike('question', `%${words[i]}%`);
      }
    }
    
    const { data: similarMatches, error: similarError } = await query.limit(5);

    if (similarError) {
      console.error('Error checking for similar questions:', similarError);
      return false;
    }

    if (similarMatches && similarMatches.length > 0) {
      // Calculate similarity
      const similarQuestion = similarMatches.find(match => {
        const similarity = calculateTextSimilarity(question, match.question);
        return similarity > 0.7; // 70% similarity threshold
      });
      
      if (similarQuestion) {
        console.log('Found similar question:', similarQuestion);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error in checkForDuplicateQuestion:', error);
    return false;
  }
}

/**
 * Calculate the text similarity between two strings (Jaccard similarity)
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score between 0 and 1
 */
function calculateTextSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Find and return all duplicate questions in the database
 * @returns Array of groups of duplicate questions
 */
export async function findAllDuplicateQuestions(): Promise<{id: string, question: string}[][]> {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, question')
      .order('question');
      
    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    const duplicateGroups: {id: string, question: string}[][] = [];
    const processedIds = new Set<string>();
    
    // Compare each question with others to find duplicates
    for (let i = 0; i < data.length; i++) {
      if (processedIds.has(data[i].id)) continue;
      
      const currentQuestion = data[i];
      const similarQuestions = [{
        id: currentQuestion.id,
        question: currentQuestion.question
      }];
      
      for (let j = i + 1; j < data.length; j++) {
        if (processedIds.has(data[j].id)) continue;
        
        const similarity = calculateTextSimilarity(
          currentQuestion.question,
          data[j].question
        );
        
        if (similarity > 0.8) { // 80% similarity threshold for duplicates
          similarQuestions.push({
            id: data[j].id,
            question: data[j].question
          });
          processedIds.add(data[j].id);
        }
      }
      
      if (similarQuestions.length > 1) {
        duplicateGroups.push(similarQuestions);
      }
      
      processedIds.add(currentQuestion.id);
    }
    
    return duplicateGroups;
  } catch (error) {
    console.error('Error in findAllDuplicateQuestions:', error);
    return [];
  }
}
