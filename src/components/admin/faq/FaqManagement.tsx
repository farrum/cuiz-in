
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useFaqAdmin } from '@/hooks/admin/useFaqAdmin';

const FaqManagement = () => {
  const { faqs, isLoading, addFaq, updateFaq, deleteFaq } = useFaqAdmin();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_published: true,
    order_index: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_published: checked }));
  };

  const handleOrderIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({ ...prev, order_index: value }));
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      is_published: true,
      order_index: faqs?.length || 0
    });
  };

  const handleAddFaq = async () => {
    if (!formData.question || !formData.answer) {
      return; // Form validation would be better here
    }

    await addFaq({
      question: formData.question,
      answer: formData.answer,
      category: formData.category,
      is_published: formData.is_published,
      order_index: formData.order_index
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditFaq = async () => {
    if (!formData.question || !formData.answer) {
      return; // Form validation would be better here
    }

    if (currentFaq) {
      await updateFaq(currentFaq.id, {
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        is_published: formData.is_published,
        order_index: formData.order_index
      });
    }

    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteFaq = async () => {
    if (currentFaq) {
      await deleteFaq(currentFaq.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (faq: any) => {
    setCurrentFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      is_published: faq.is_published,
      order_index: faq.order_index
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: any) => {
    setCurrentFaq(faq);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">FAQ Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              New FAQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new FAQ</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Input 
                  id="question" 
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="answer">Answer</Label>
                <Textarea 
                  id="answer" 
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="order_index">Display Order</Label>
                <Input 
                  id="order_index" 
                  name="order_index"
                  type="number"
                  value={formData.order_index.toString()}
                  onChange={handleOrderIndexChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="publish" 
                  checked={formData.is_published}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="publish">Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFaq}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {faqs?.map((faq) => (
            <div key={faq.id} className="p-5 border rounded-xl bg-card text-card-foreground shadow-sm space-y-2">
              <h3 className="font-semibold text-base text-foreground">{faq.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(faq)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(faq)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-question">Question</Label>
              <Input 
                id="edit-question" 
                name="question"
                value={formData.question}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea 
                id="edit-answer" 
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input 
                id="edit-category" 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-order">Display Order</Label>
              <Input 
                id="edit-order" 
                name="order_index"
                type="number"
                value={formData.order_index.toString()}
                onChange={handleOrderIndexChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-publish" 
                checked={formData.is_published}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="edit-publish">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditFaq}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteFaq}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaqManagement;
