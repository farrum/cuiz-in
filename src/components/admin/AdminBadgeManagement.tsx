
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Trash, Search, Award, Star, Zap, BookOpen, Target, Trophy, Medal, Crown, Flag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { BadgeType, DEFAULT_BADGES, getIconComponent } from '@/utils/badgeData';

const BADGE_ICONS = [
  { name: 'Award', component: Award },
  { name: 'Star', component: Star },
  { name: 'Zap', component: Zap },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Target', component: Target },
  { name: 'Trophy', component: Trophy },
  { name: 'Medal', component: Medal },
  { name: 'Crown', component: Crown },
  { name: 'Flag', component: Flag }
];

const BADGE_COLORS = [
  { name: 'Blue', colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
  { name: 'Green', colorClass: 'text-green-600', bgClass: 'bg-green-100' },
  { name: 'Red', colorClass: 'text-red-600', bgClass: 'bg-red-100' },
  { name: 'Purple', colorClass: 'text-purple-600', bgClass: 'bg-purple-100' },
  { name: 'Yellow', colorClass: 'text-yellow-600', bgClass: 'bg-yellow-100' },
  { name: 'Pink', colorClass: 'text-pink-600', bgClass: 'bg-pink-100' },
  { name: 'Indigo', colorClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
  { name: 'Orange', colorClass: 'text-orange-600', bgClass: 'bg-orange-100' },
  { name: 'Teal', colorClass: 'text-teal-600', bgClass: 'bg-teal-100' }
];

const CRITERIA_TYPES = [
  { value: 'questions_answered', label: 'Questions Answered' },
  { value: 'daily_streak', label: 'Daily Streak' },
  { value: 'monthly_complete', label: 'Monthly Target Completion' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'custom', label: 'Custom' }
];

const AdminBadgeManagement: React.FC = () => {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<BadgeType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewIcon, setPreviewIcon] = useState<string>('Award');
  const [previewColor, setPreviewColor] = useState<{colorClass: string, bgClass: string}>(BADGE_COLORS[0]);
  
  const form = useForm<BadgeType>();
  const editForm = useForm<BadgeType>();

  // Load badges from localStorage
  useEffect(() => {
    const storedBadges = localStorage.getItem('quiz_app_badges');
    
    if (storedBadges) {
      setBadges(JSON.parse(storedBadges));
    } else {
      // Initialize with default badges
      setBadges(DEFAULT_BADGES);
      localStorage.setItem('quiz_app_badges', JSON.stringify(DEFAULT_BADGES));
    }
  }, []);
  
  // Filter badges based on search term
  const filteredBadges = badges.filter(badge => 
    badge.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    badge.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Create new badge
  const handleCreateBadge = (data: BadgeType) => {
    const newBadge: BadgeType = {
      ...data,
      id: Date.now().toString(),
    };
    
    const updatedBadges = [...badges, newBadge];
    setBadges(updatedBadges);
    localStorage.setItem('quiz_app_badges', JSON.stringify(updatedBadges));
    
    toast({
      title: "Success",
      description: `Badge "${newBadge.name}" has been created.`,
    });
    
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  // Edit existing badge
  const handleEditBadge = (data: BadgeType) => {
    const updatedBadges = badges.map(badge => 
      badge.id === data.id ? { ...data } : badge
    );
    
    setBadges(updatedBadges);
    localStorage.setItem('quiz_app_badges', JSON.stringify(updatedBadges));
    
    toast({
      title: "Success",
      description: `Badge "${data.name}" has been updated.`,
    });
    
    setIsEditDialogOpen(false);
    editForm.reset();
  };
  
  // Delete badge
  const handleDeleteBadge = (badgeId: string) => {
    const badgeToDelete = badges.find(badge => badge.id === badgeId);
    
    if (badgeToDelete) {
      const updatedBadges = badges.filter(badge => badge.id !== badgeId);
      setBadges(updatedBadges);
      localStorage.setItem('quiz_app_badges', JSON.stringify(updatedBadges));
      
      toast({
        title: "Badge Deleted",
        description: `"${badgeToDelete.name}" has been deleted.`,
        variant: "destructive"
      });
    }
  };
  
  // Open edit dialog with badge data
  const openEditDialog = (badge: BadgeType) => {
    setCurrentBadge(badge);
    setPreviewIcon(badge.icon);
    
    const colorObj = BADGE_COLORS.find(c => 
      c.colorClass === badge.colorClass && c.bgClass === badge.bgClass
    ) || BADGE_COLORS[0];
    
    setPreviewColor(colorObj);
    editForm.reset(badge);
    setIsEditDialogOpen(true);
  };
  
  // Reset to default badges
  const resetToDefaultBadges = () => {
    setBadges(DEFAULT_BADGES);
    localStorage.setItem('quiz_app_badges', JSON.stringify(DEFAULT_BADGES));
    
    toast({
      title: "Badges Reset",
      description: "All badges have been reset to default.",
    });
  };
  
  // Preview badge during creation/editing
  const BadgePreview = ({ icon, color }: { icon: string, color: {colorClass: string, bgClass: string} }) => {
    const IconComponent = getIconComponent(icon);
    
    return (
      <div className={`flex flex-col items-center p-4 rounded-lg ${color.bgClass}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-white/50 ${color.colorClass}`}>
          <IconComponent className="w-8 h-8" />
        </div>
        <div className="text-center">
          <div className="font-medium">
            {form.watch('name') || editForm.watch('name') || 'Badge Name'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {form.watch('description') || editForm.watch('description') || 'Badge description will appear here'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Badge Management</h2>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search badges..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" onClick={resetToDefaultBadges}>
            Reset to Default
          </Button>
          
          <Button onClick={() => {
            setPreviewIcon('Award');
            setPreviewColor(BADGE_COLORS[0]);
            form.reset({
              id: '',
              name: '',
              description: '',
              icon: 'Award',
              criteria: {
                type: 'questions_answered',
                threshold: 10
              },
              colorClass: 'text-blue-600',
              bgClass: 'bg-blue-100'
            });
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Badge
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Badge</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Criteria</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBadges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No badges found
                </TableCell>
              </TableRow>
            ) : (
              filteredBadges.map((badge) => {
                const BadgeIcon = getIconComponent(badge.icon);
                const criteriaType = CRITERIA_TYPES.find(ct => ct.value === badge.criteria.type)?.label || 'Custom';
                
                return (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.bgClass}`}>
                          <BadgeIcon className={`w-5 h-5 ${badge.colorClass}`} />
                        </div>
                        <div className="font-medium">{badge.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{badge.description}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{criteriaType}:</span> {badge.criteria.threshold}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(badge)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBadge(badge.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Create Badge Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Badge</DialogTitle>
            <DialogDescription>
              Create a new badge for users to earn based on their activities.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateBadge)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Badge Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Expert" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Answer 100 questions" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setPreviewIcon(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BADGE_ICONS.map(icon => (
                              <SelectItem key={icon.name} value={icon.name}>
                                <div className="flex items-center">
                                  <icon.component className="w-4 h-4 mr-2" />
                                  {icon.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="criteria.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Criteria Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CRITERIA_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="criteria.threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Threshold</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10" 
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Number required to earn
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="colorClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {BADGE_COLORS.map((colorOption) => (
                            <div
                              key={colorOption.name}
                              className={`${colorOption.bgClass} rounded p-2 cursor-pointer text-center text-xs ${
                                colorOption.colorClass === field.value ? 'ring-2 ring-primary' : ''
                              }`}
                              onClick={() => {
                                field.onChange(colorOption.colorClass);
                                form.setValue('bgClass', colorOption.bgClass);
                                setPreviewColor(colorOption);
                              }}
                            >
                              {colorOption.name}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Badge</Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
            
            <div className="flex flex-col justify-center items-center">
              <h4 className="text-sm font-medium mb-4">Badge Preview</h4>
              <BadgePreview icon={previewIcon} color={previewColor} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Badge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
            <DialogDescription>
              Update badge details and criteria.
            </DialogDescription>
          </DialogHeader>
          
          {currentBadge && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
              <div>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(handleEditBadge)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setPreviewIcon(value);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BADGE_ICONS.map(icon => (
                                <SelectItem key={icon.name} value={icon.name}>
                                  <div className="flex items-center">
                                    <icon.component className="w-4 h-4 mr-2" />
                                    {icon.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={editForm.control}
                        name="criteria.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Criteria Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CRITERIA_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="criteria.threshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Threshold</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={editForm.control}
                      name="colorClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {BADGE_COLORS.map((colorOption) => (
                              <div
                                key={colorOption.name}
                                className={`${colorOption.bgClass} rounded p-2 cursor-pointer text-center text-xs ${
                                  colorOption.colorClass === field.value ? 'ring-2 ring-primary' : ''
                                }`}
                                onClick={() => {
                                  field.onChange(colorOption.colorClass);
                                  editForm.setValue('bgClass', colorOption.bgClass);
                                  setPreviewColor(colorOption);
                                }}
                              >
                                {colorOption.name}
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <input type="hidden" {...editForm.register('id')} />
                    <input type="hidden" {...editForm.register('bgClass')} />
                    
                    <DialogFooter className="mt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
              
              <div className="flex flex-col justify-center items-center">
                <h4 className="text-sm font-medium mb-4">Badge Preview</h4>
                <BadgePreview icon={previewIcon} color={previewColor} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBadgeManagement;
