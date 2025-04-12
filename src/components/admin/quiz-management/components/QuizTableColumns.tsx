
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash, ImageIcon } from 'lucide-react';
import { QuizQuestion } from '@/utils/quizData';

export const getTextQuizColumns = (
  onEdit: (question: QuizQuestion) => void,
  onDelete: (id: string) => void
) => [
  {
    header: "Question",
    accessorKey: "question",
    cell: (row: QuizQuestion) => <span className="font-medium">{row.question}</span>
  },
  {
    header: "Category",
    accessorKey: "category"
  },
  {
    header: "Difficulty",
    accessorKey: "difficulty",
    cell: (row: QuizQuestion) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
        row.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.difficulty}
      </span>
    )
  },
  {
    header: "Answer",
    accessorKey: "correctAnswer"
  },
  {
    header: "Actions",
    accessorKey: "actions",
    cell: (row: QuizQuestion) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    )
  }
];

export const getImageQuizColumns = (
  onEdit: (question: QuizQuestion) => void,
  onDelete: (id: string) => void
) => [
  { 
    header: 'Question', 
    accessorKey: 'question' 
  },
  { 
    header: 'Image', 
    accessorKey: 'imageUrl',
    cell: (row: QuizQuestion) => (
      <div className="h-16 w-24 relative">
        {row.imageUrl ? (
          <img 
            src={row.imageUrl} 
            alt="Question" 
            className="h-full w-full object-contain rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center rounded-md">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
    )
  },
  { 
    header: 'Category', 
    accessorKey: 'category' 
  },
  { 
    header: 'Difficulty', 
    accessorKey: 'difficulty',
    cell: (row: QuizQuestion) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
        row.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.difficulty}
      </span>
    )
  },
  { 
    header: 'Correct Answer', 
    accessorKey: 'correctAnswer' 
  },
  { 
    header: 'Actions', 
    accessorKey: 'id',
    cell: (row: QuizQuestion) => (
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    )
  }
];
