
import React from 'react';
import { FormLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface QuizOptionsFieldProps {
  form: UseFormReturn<any>;
}

const QuizOptionsField: React.FC<QuizOptionsFieldProps> = ({ form }) => {
  const { watch, setValue, getValues } = form;
  const options = watch('options');

  const handleAddOption = () => {
    setValue('options', [...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Ensure at least 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setValue('options', newOptions);
    
    // If the correct answer was the removed option, reset it
    const correctAnswer = getValues('correctAnswer');
    if (correctAnswer === options[index]) {
      setValue('correctAnswer', '');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setValue('options', newOptions);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <FormLabel>Options</FormLabel>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleAddOption}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Option
        </Button>
      </div>
      
      {options.map((option: string, index: number) => (
        <div key={index} className="flex gap-2">
          <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveOption(index)}
            disabled={options.length <= 2}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      {options.length < 2 && (
        <p className="text-sm text-destructive">
          At least 2 options are required.
        </p>
      )}
    </div>
  );
};

export default QuizOptionsField;
