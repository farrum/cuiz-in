
import React from 'react';
import { Button } from '@/components/ui/button';

interface NameInputFormProps {
  userName: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
}

const NameInputForm: React.FC<NameInputFormProps> = ({ 
  userName, 
  onChange = () => {}, 
  onSubmit = () => {} 
}) => {
  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto glass p-6 rounded-2xl animate-scale-in">
      <label className="block text-sm font-medium mb-2" htmlFor="name">
        What should we call you?
      </label>
      <input 
        type="text" 
        id="name" 
        value={userName} 
        onChange={onChange} 
        placeholder="Your name" 
        className="w-full p-3 rounded-lg border border-border bg-background mb-4" 
        autoFocus 
      />
      <Button 
        type="submit" 
        className="w-full fun-button" 
        disabled={!userName.trim()}
      >
        Start Playing
      </Button>
    </form>
  );
};

export default NameInputForm;
