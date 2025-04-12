
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';

interface CorrectAnswerFieldProps {
  form: UseFormReturn<any>;
}

const CorrectAnswerField: React.FC<CorrectAnswerFieldProps> = ({ form }) => {
  const options = form.watch('options');
  
  return (
    <FormField
      control={form.control}
      name="correctAnswer"
      rules={{ required: "Correct answer is required" }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Correct Answer</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select the correct answer" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option: string, index: number) => (
                option && (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CorrectAnswerField;
