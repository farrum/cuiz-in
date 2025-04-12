
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';

interface CategoryFieldProps {
  form: UseFormReturn<any>;
  categories: string[];
  setLocalCategories: (categories: string[]) => void;
}

const CategoryField: React.FC<CategoryFieldProps> = ({ form, categories, setLocalCategories }) => {
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      // Add to local categories
      const newCat = newCategory.trim();
      if (!categories.includes(newCat)) {
        setLocalCategories([...categories, newCat]);
      }
      // Set as selected
      form.setValue('category', newCat);
      setNewCategory('');
      setShowNewCategoryInput(false);
    }
  };

  return (
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
                  {categories.map((category, index) => (
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
  );
};

export default CategoryField;
