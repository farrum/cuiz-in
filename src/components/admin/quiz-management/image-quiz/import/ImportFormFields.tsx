
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';

interface AmountFieldProps {
  form: UseFormReturn<any>;
}

export const AmountField: React.FC<AmountFieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="amount"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Number of Questions</FormLabel>
        <Select 
          onValueChange={field.onChange} 
          defaultValue={field.value}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select amount" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="5">5 questions</SelectItem>
            <SelectItem value="10">10 questions</SelectItem>
            <SelectItem value="15">15 questions</SelectItem>
            <SelectItem value="20">20 questions</SelectItem>
            <SelectItem value="30">30 questions</SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>
          The number of questions to import.
        </FormDescription>
      </FormItem>
    )}
  />
);

interface CategoryFieldProps {
  form: UseFormReturn<any>;
  categories: Record<number, string>;
}

export const CategoryField: React.FC<CategoryFieldProps> = ({ form, categories }) => (
  <FormField
    control={form.control}
    name="category"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Category</FormLabel>
        <Select 
          onValueChange={field.onChange}
          value={field.value}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Any category" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="any">Any category</SelectItem>
            {Object.entries(categories).map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Select a category or leave blank for random categories.
        </FormDescription>
      </FormItem>
    )}
  />
);

interface DifficultyFieldProps {
  form: UseFormReturn<any>;
}

export const DifficultyField: React.FC<DifficultyFieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="difficulty"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Difficulty</FormLabel>
        <Select 
          onValueChange={field.onChange} 
          value={field.value}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Any difficulty" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="any">Any difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>
          Select a difficulty level or leave blank for mixed difficulty.
        </FormDescription>
      </FormItem>
    )}
  />
);
