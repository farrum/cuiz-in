
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ImportQuizQuestionsProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ImportQuizQuestions: React.FC<ImportQuizQuestionsProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationErrors([]);
    }
  };

  const validateQuestionData = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = ['Question', 'Options', 'CorrectAnswer', 'Category', 'Difficulty'];
    
    if (data.length === 0) {
      errors.push('The Excel file is empty. Please add some questions.');
      return { valid: false, errors };
    }
    
    // Check if all required fields are present
    const firstRow = data[0];
    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        errors.push(`Missing column: ${field}`);
      }
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    // Validate each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because of 0-indexing and header row
      
      if (!row.Question) {
        errors.push(`Row ${rowNum}: Question is missing`);
      }
      
      if (!row.Options) {
        errors.push(`Row ${rowNum}: Options are missing`);
      } else {
        const options = row.Options.split('|');
        if (options.length < 2) {
          errors.push(`Row ${rowNum}: At least 2 options are required (separate with |)`);
        }
        
        if (!options.includes(row.CorrectAnswer)) {
          errors.push(`Row ${rowNum}: Correct answer must be one of the options`);
        }
      }
      
      if (!row.CorrectAnswer) {
        errors.push(`Row ${rowNum}: Correct answer is missing`);
      }
      
      if (!row.Category) {
        errors.push(`Row ${rowNum}: Category is missing`);
      }
      
      if (!row.Difficulty) {
        errors.push(`Row ${rowNum}: Difficulty is missing`);
      } else if (!['easy', 'medium', 'hard'].includes(row.Difficulty.toLowerCase())) {
        errors.push(`Row ${rowNum}: Difficulty must be easy, medium, or hard`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Read the Excel file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          setUploadProgress(30);
          
          // Validate the data
          const validation = validateQuestionData(jsonData);
          
          if (!validation.valid) {
            setValidationErrors(validation.errors);
            setIsUploading(false);
            setUploadProgress(0);
            return;
          }
          
          setUploadProgress(50);
          
          // Transform the data
          const questionsToInsert = jsonData.map((row: any) => {
            return {
              question: row.Question,
              options: row.Options.split('|'),
              correct_answer: row.CorrectAnswer,
              category: row.Category,
              difficulty: row.Difficulty.toLowerCase(),
              explanation: row.Explanation || ''
            };
          });
          
          setUploadProgress(70);
          
          // Insert data in batches of 50 to avoid timeout
          const BATCH_SIZE = 50;
          const batches = [];
          
          for (let i = 0; i < questionsToInsert.length; i += BATCH_SIZE) {
            batches.push(questionsToInsert.slice(i, i + BATCH_SIZE));
          }
          
          for (let i = 0; i < batches.length; i++) {
            const { error } = await supabase
              .from('quiz_questions')
              .insert(batches[i]);
              
            if (error) throw error;
            
            // Update progress
            setUploadProgress(70 + Math.floor(30 * ((i + 1) / batches.length)));
          }
          
          toast({
            title: "Success",
            description: `Imported ${questionsToInsert.length} questions successfully!`,
          });
          
          onSuccess();
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Error",
            description: "Failed to process the Excel file. Please check the format.",
            variant: "destructive"
          });
          setIsUploading(false);
          setUploadProgress(0);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the Excel file.",
          variant: "destructive"
        });
        setIsUploading(false);
        setUploadProgress(0);
      };
      
      reader.readAsBinaryString(file);
      
    } catch (error) {
      console.error('Error uploading questions:', error);
      toast({
        title: "Error",
        description: "Failed to upload questions.",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Question: "What is the capital of France?",
        Options: "London|Berlin|Paris|Madrid",
        CorrectAnswer: "Paris",
        Category: "Geography",
        Difficulty: "easy",
        Explanation: "Paris is the capital and most populous city of France."
      },
      {
        Question: "Which planet is known as the Red Planet?",
        Options: "Earth|Mars|Jupiter|Venus",
        CorrectAnswer: "Mars",
        Category: "Astronomy",
        Difficulty: "easy",
        Explanation: "Mars appears reddish because of iron oxide (rust) on its surface."
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'quiz_questions_template.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-md p-6 text-center space-y-4">
        <div className="flex justify-center">
          <FileUp className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground pb-2">
            Upload an Excel file with quiz questions
          </p>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <label htmlFor="file-upload">
            <Button 
              variant="outline" 
              className="mr-2" 
              disabled={isUploading}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Choose File
            </Button>
          </label>
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            disabled={isUploading}
          >
            Download Template
          </Button>
        </div>
        {file && (
          <p className="text-sm">
            Selected file: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive">Validation Errors</h4>
              <ul className="list-disc pl-5 pt-2 space-y-1">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-sm">And {validationErrors.length - 5} more errors...</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Uploading... {uploadProgress}%
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          Upload
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ImportQuizQuestions;
