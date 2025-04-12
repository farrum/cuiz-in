
import React, { useState } from 'react';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { 
  useQuizQuestions, 
  useQuizFilters, 
  useQuizActions
} from './hooks';
import {
  QuizManagementHeader,
  QuizFilterSection,
  EmptyQuizState,
  QuizDialogs,
  getTextQuizColumns,
  getImageQuizColumns
} from './components';

const QuizManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('text');
  
  // Data fetching and state management hooks
  const { 
    questions, 
    imageQuestions, 
    filteredQuestions, 
    setFilteredQuestions, 
    categories, 
    isLoading, 
    fetchQuestions 
  } = useQuizQuestions();
  
  // Filter management hook
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory,
    selectedDifficulty, 
    setSelectedDifficulty 
  } = useQuizFilters(questions, imageQuestions, activeTab, setFilteredQuestions);
  
  // Actions management hook
  const {
    isAddDialogOpen, 
    setIsAddDialogOpen,
    isEditDialogOpen, 
    setIsEditDialogOpen,
    isImportDialogOpen, 
    setIsImportDialogOpen,
    currentQuestion, 
    setCurrentQuestion,
    isTriviaBatchDialogOpen, 
    setIsTriviaBatchDialogOpen,
    isLearnTriviaDialogOpen, 
    setIsLearnTriviaDialogOpen,
    isLearnImageTriviaDialogOpen, 
    setIsLearnImageTriviaDialogOpen,
    isImageQuizDialogOpen, 
    setIsImageQuizDialogOpen,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    exportToExcel
  } = useQuizActions(fetchQuestions, categories);

  // Column definitions for text and image questions
  const textColumns = getTextQuizColumns(
    (question) => {
      setCurrentQuestion(question);
      setIsEditDialogOpen(true);
    },
    handleDeleteQuestion
  );
  
  const imageColumns = getImageQuizColumns(
    (question) => {
      setCurrentQuestion(question);
      setIsEditDialogOpen(true);
    },
    handleDeleteQuestion
  );

  // Check if filters are applied
  const hasFilters = searchQuery.trim() !== '' || 
    selectedCategory !== 'all' || 
    selectedDifficulty !== 'all';

  return (
    <div className="space-y-6">
      <QuizManagementHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddQuestion={() => setIsAddDialogOpen(true)}
        onImportQuestions={() => setIsImportDialogOpen(true)}
        onLearnTrivia={() => setIsLearnTriviaDialogOpen(true)}
        onExport={() => exportToExcel(activeTab, filteredQuestions)}
        onAddImageQuestion={() => setIsImageQuizDialogOpen(true)}
        onLearnImageTrivia={() => setIsLearnImageTriviaDialogOpen(true)}
      />

      <QuizFilterSection 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        categories={categories}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <EmptyQuizState
          type={activeTab as 'text' | 'image'}
          hasFilters={hasFilters}
          onAddQuestion={() => 
            activeTab === 'text' 
              ? setIsAddDialogOpen(true) 
              : setIsImageQuizDialogOpen(true)
          }
          onLearnTrivia={() => 
            activeTab === 'text' 
              ? setIsLearnTriviaDialogOpen(true) 
              : setIsLearnImageTriviaDialogOpen(true)
          }
        />
      ) : (
        <div className={activeTab === 'image' ? "mt-4" : "border rounded-md"}>
          <PaginatedDataTable
            columns={activeTab === 'text' ? textColumns : imageColumns}
            data={filteredQuestions}
            isLoading={isLoading}
            pageSize={10}
          />
        </div>
      )}

      <QuizDialogs
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isImportDialogOpen={isImportDialogOpen}
        setIsImportDialogOpen={setIsImportDialogOpen}
        isTriviaBatchDialogOpen={isTriviaBatchDialogOpen}
        setIsTriviaBatchDialogOpen={setIsTriviaBatchDialogOpen}
        isLearnTriviaDialogOpen={isLearnTriviaDialogOpen}
        setIsLearnTriviaDialogOpen={setIsLearnTriviaDialogOpen}
        isLearnImageTriviaDialogOpen={isLearnImageTriviaDialogOpen}
        setIsLearnImageTriviaDialogOpen={setIsLearnImageTriviaDialogOpen}
        isImageQuizDialogOpen={isImageQuizDialogOpen}
        setIsImageQuizDialogOpen={setIsImageQuizDialogOpen}
        currentQuestion={currentQuestion}
        categories={categories}
        handleAddQuestion={handleAddQuestion}
        handleUpdateQuestion={handleUpdateQuestion}
        fetchQuestions={fetchQuestions}
      />
    </div>
  );
};

export default QuizManagement;
