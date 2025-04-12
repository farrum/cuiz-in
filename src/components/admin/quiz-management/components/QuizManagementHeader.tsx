
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  FileUp, 
  Download,
  BookOpenIcon,
  ImageIcon
} from 'lucide-react';

interface QuizManagementHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddQuestion: () => void;
  onImportQuestions: () => void;
  onLearnTrivia: () => void;
  onExport: () => void;
  onAddImageQuestion: () => void;
  onLearnImageTrivia: () => void;
}

const QuizManagementHeader: React.FC<QuizManagementHeaderProps> = ({
  activeTab,
  setActiveTab,
  onAddQuestion,
  onImportQuestions,
  onLearnTrivia,
  onExport,
  onAddImageQuestion,
  onLearnImageTrivia
}) => {
  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="text">Text Questions</TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            Image Questions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="text">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Text Quiz Questions</h2>
            <div className="flex gap-2">
              <Button 
                onClick={onAddQuestion}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add Question
              </Button>
              <Button 
                onClick={onLearnTrivia}
                variant="outline"
                className="flex items-center gap-1"
              >
                <BookOpenIcon className="h-4 w-4" />
                Learn Trivia
              </Button>
              <Button 
                onClick={onImportQuestions}
                variant="outline"
                className="flex items-center gap-1"
              >
                <FileUp className="h-4 w-4" />
                Import
              </Button>
              <Button 
                onClick={onExport}
                variant="outline"
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Image Quiz Questions</h2>
            <div className="flex gap-2">
              <Button 
                onClick={onAddImageQuestion}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add Image Question
              </Button>
              <Button 
                onClick={onLearnImageTrivia}
                variant="outline"
                className="flex items-center gap-1"
              >
                <BookOpenIcon className="h-4 w-4" />
                Learn Image Trivia
              </Button>
              <Button 
                onClick={onExport}
                variant="outline"
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default QuizManagementHeader;
