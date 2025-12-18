import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FaqListProps {
  faqs: Faq[];
  isLoading: boolean;
}

const createSlug = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
};

export const FaqList = ({ faqs, isLoading }: FaqListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((item) => (
        <AccordionItem key={item.id} value={`item-${item.id}`}>
          <AccordionTrigger className="text-left font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-3">{item.answer}</p>
            <Link 
              to={`/faq/${item.id}/${createSlug(item.question)}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Read more <ExternalLink className="h-3 w-3" />
            </Link>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
