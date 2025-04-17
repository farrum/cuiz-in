
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useFaqs } from '@/hooks/useFaqs';

const FaqManagement = () => {
  const { faqs, isLoading } = useFaqs();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">FAQ Management</h2>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          New FAQ
        </Button>
      </div>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {faqs?.map((faq) => (
            <div key={faq.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaqManagement;
