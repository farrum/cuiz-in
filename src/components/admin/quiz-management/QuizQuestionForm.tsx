
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash } from 'lucide-react';
import { QuizQuestion } from '@/utils/quizData';

interface QuizQuestionFormProps {
  initialData?: QuizQuestion;
  categories: string[];
  onSubmit: (data: QuizQuestion | Omit<QuizQuestion, 'id'>) => void;
  onCancel: () => void;
}

const QuizQuestionForm: React.FC<QuizQuestionFormProps> = ({
  initialData,
  categories,
  onSubmit,
  onCancel
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  
  const defaultValues = initialData || {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'easy' as const,
    category: '',
    points: 10,
    explanation: ''
  };

  const form = useForm({
    defaultValues
  });

  const { watch, setValue, getValues } = form;
  const options = watch('options');
  const selectedCategory = watch('category');

  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

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

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      // Add to local categories
      const newCat = newCategory.trim();
      if (!localCategories.includes(newCat)) {
        setLocalCategories([...localCategories, newCat]);
      }
      // Set as selected
      setValue('category', newCat);
      setNewCategory('');
      setShowNewCategoryInput(false);
    }
  };

  // Submit the form data
  const handleFormSubmit = form.handleSubmit((data) => {
    // Ensure options array doesn't contain empty strings
    const cleanedOptions = data.options.filter(option => option.trim() !== '');
    
    if (cleanedOptions.length < 2) {
      form.setError('options', { 
        type: 'manual', 
        message: 'At least 2 non-empty options are required.' 
      });
      return;
    }
    
    if (!data.correctAnswer) {
      form.setError('correctAnswer', { 
        type: 'manual', 
        message: 'Please select the correct answer.' 
      });
      return;
    }
    
    const formData = {
      ...data,
      options: cleanedOptions
    };
    
    if (initialData) {
      onSubmit({ ...formData, id: initialData.id });
    } else {
      onSubmit(formData);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Question Field */}
        <FormField
          control={form.control}
          name="question"
          rules={{ required: "Question is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your question" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options Field */}
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
          {options.map((option, index) => (
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

        {/* Correct Answer Field */}
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
                  {options.map((option, index) => (
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

        {/* Category Field */}
        <FormField
          control={form.control}
          name="category"
          rules={{ required: "Category is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              {showNewCategoryInput ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewCategory}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCategoryInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {localCategories.map((category, index) => (
                        <SelectItem key={index} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowNewCategoryInput(true)}
                    className="px-0"
                  >
                    Add new category
                  </Button>
                </>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Difficulty Field */}
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
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Points Field */}
        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                />
              </FormControl>
              <FormDescription>
                Points awarded for correctly answering this question.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Explanation Field */}
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide an explanation for the correct answer" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                An explanation to show after the user answers the question.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Question' : 'Add Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuizQuestionForm;
