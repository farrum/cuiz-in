
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ImportQuizQuestionsProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ImportQuizQuestions: React.FC<ImportQuizQuestionsProps> = ({
  onSuccess,
  onCancel
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError(null);
    setProcessedRows(0);
    
    try {
      const data = await readExcelFile(selectedFile);
      if (!data || data.length === 0) {
        throw new Error("No data found in the file");
      }
      
      setTotalRows(data.length);
      
      // Process in batches to avoid overloading the server
      const batchSize = 10;
      const batches = Math.ceil(data.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batchData = data.slice(i * batchSize, (i + 1) * batchSize);
        await uploadBatch(batchData);
        setProcessedRows((i + 1) * batchSize > data.length ? data.length : (i + 1) * batchSize);
      }
      
      toast({
        title: "Success",
        description: `Successfully imported ${data.length} questions.`,
      });
      
      onSuccess();
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : "Failed to import questions",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate and transform the data
          const transformedData = jsonData.map((row: any, index) => {
            // Ensure required fields are present
            if (!row.Question || !row.Options || !row.CorrectAnswer || !row.Category) {
              throw new Error(`Row ${index + 1}: Missing required fields (Question, Options, CorrectAnswer, or Category)`);
            }
            
            // Parse options
            let options: string[] = [];
            if (typeof row.Options === 'string') {
              options = row.Options.split('|').map((opt: string) => opt.trim()).filter(Boolean);
            } else if (Array.isArray(row.Options)) {
              options = row.Options;
            }
            
            if (options.length < 2) {
              throw new Error(`Row ${index + 1}: At least 2 options are required`);
            }
            
            // Validate correct answer is in options
            if (!options.includes(row.CorrectAnswer)) {
              throw new Error(`Row ${index + 1}: Correct answer "${row.CorrectAnswer}" is not in the options`);
            }
            
            // Default to medium difficulty if not specified
            const difficulty = row.Difficulty ? row.Difficulty.toLowerCase() : 'medium';
            if (!['easy', 'medium', 'hard'].includes(difficulty)) {
              throw new Error(`Row ${index + 1}: Difficulty must be 'easy', 'medium', or 'hard'`);
            }
            
            return {
              question: row.Question,
              options: options,
              correct_answer: row.CorrectAnswer,
              category: row.Category,
              difficulty: difficulty,
              explanation: row.Explanation || ''
            };
          });
          
          resolve(transformedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read the file"));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  const uploadBatch = async (batch: any[]) => {
    const { error } = await supabase
      .from('quiz_questions')
      .insert(batch);
      
    if (error) {
      throw new Error(`Failed to upload questions: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          className="file:mr-4 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        {selectedFile && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <FileSpreadsheet className="h-4 w-4" />
            {selectedFile.name}
          </div>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              Uploading... {processedRows}/{totalRows} questions
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ 
                width: totalRows ? `${(processedRows / totalRows) * 100}%` : '0%' 
              }}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button 
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : 'Upload Questions'}
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground mt-4">
        <p className="font-medium">File format requirements:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Excel file (.xlsx or .xls)</li>
          <li>Required columns: Question, Options, CorrectAnswer, Category</li>
          <li>Optional columns: Difficulty, Explanation</li>
          <li>Options should be separated by a pipe character (|)</li>
          <li>CorrectAnswer must be one of the options</li>
          <li>Difficulty must be one of: easy, medium, hard</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportQuizQuestions;
