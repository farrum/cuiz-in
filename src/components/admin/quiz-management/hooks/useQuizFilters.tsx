
import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/utils/quizData';

export const useQuizFilters = (
  questions: QuizQuestion[],
  imageQuestions: QuizQuestion[],
  activeTab: string,
  setFilteredQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    const baseQuestions = activeTab === 'text' ? questions : imageQuestions;
    let filtered = [...baseQuestions];
    
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    if (selectedDifficulty && selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    setFilteredQuestions(filtered);
  }, [searchQuery, selectedCategory, selectedDifficulty, questions, imageQuestions, activeTab, setFilteredQuestions]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty
  };
};
