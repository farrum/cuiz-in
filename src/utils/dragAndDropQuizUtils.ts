
import { QuizQuestion } from './types';

export interface DragAndDropItem {
  id: string;
  text: string;
  correctPosition: number;
}

export interface DragAndDropQuestion extends QuizQuestion {
  questionType: 'drag-and-drop';
  items: DragAndDropItem[];
}

// Check if a question is a drag-and-drop question
export const isDragAndDropQuestion = (question: QuizQuestion): question is DragAndDropQuestion => {
  return question.questionType === 'drag-and-drop';
};

// Verify if the user's arrangement is correct
export const checkDragAndDropAnswer = (
  question: DragAndDropQuestion, 
  userArrangement: DragAndDropItem[]
): boolean => {
  return userArrangement.every((item, index) => {
    return item.correctPosition === index;
  });
};

// Create sample drag-and-drop questions
export const getSampleDragAndDropQuestions = (): DragAndDropQuestion[] => {
  return [
    {
      id: 'dd-q1',
      question: 'Arrange the planets in order of distance from the sun, starting with the closest.',
      options: [], // Not used in drag-and-drop
      correctAnswer: '', // Not used in drag-and-drop
      difficulty: 'medium',
      category: 'Astronomy',
      points: 15,
      explanation: 'The correct order is: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.',
      questionType: 'drag-and-drop',
      items: [
        { id: 'planet1', text: 'Mercury', correctPosition: 0 },
        { id: 'planet2', text: 'Venus', correctPosition: 1 },
        { id: 'planet3', text: 'Earth', correctPosition: 2 },
        { id: 'planet4', text: 'Mars', correctPosition: 3 },
        { id: 'planet5', text: 'Jupiter', correctPosition: 4 },
        { id: 'planet6', text: 'Saturn', correctPosition: 5 },
        { id: 'planet7', text: 'Uranus', correctPosition: 6 },
        { id: 'planet8', text: 'Neptune', correctPosition: 7 },
      ]
    },
    {
      id: 'dd-q2',
      question: 'Arrange these events in chronological order, from earliest to latest.',
      options: [],
      correctAnswer: '',
      difficulty: 'hard',
      category: 'History',
      points: 20,
      explanation: 'The correct order is: Declaration of Independence (1776), Industrial Revolution (1760-1840), World War I (1914-1918), Moon Landing (1969), Fall of the Berlin Wall (1989).',
      questionType: 'drag-and-drop',
      items: [
        { id: 'event1', text: 'Declaration of Independence', correctPosition: 0 },
        { id: 'event2', text: 'Industrial Revolution', correctPosition: 1 },
        { id: 'event3', text: 'World War I', correctPosition: 2 },
        { id: 'event4', text: 'Moon Landing', correctPosition: 3 },
        { id: 'event5', text: 'Fall of the Berlin Wall', correctPosition: 4 },
      ]
    }
  ];
};
