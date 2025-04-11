
import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { Key, MoreHorizontal, CheckSquare, UserCheck, UserX, Ban } from 'lucide-react';
import { TeamMember } from '@/hooks/useTeamMembers';

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  isLoading: boolean;
  onStatusChange: (memberId: string, status: 'active' | 'inactive' | 'suspended') => void;
  onResetPassword?: (memberId: string) => void;
  onRequestAction?: (memberId: string, action: 'suspend' | 'reactivate') => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  teamMembers,
  isLoading,
  onStatusChange,
  onResetPassword,
  onRequestAction
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: 'activate' | 'suspend' | null;
  }>({ open: false, action: null });
  
  if (isLoading) {
    return <div className="text-center py-8">Loading team members...</div>;
  }
  
  const totalPages = Math.ceil(teamMembers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, teamMembers.length);
  const currentMembers = teamMembers.slice(startIndex, endIndex);
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        endPage = Math.min(4, totalPages - 1);
      }
      if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      if (startPage > 2) {
        pageNumbers.push('ellipsis1');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis2');
      }
      
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleResetPassword = (userId: string) => {
    setPasswordResetUserId(userId);
  };

  const confirmResetPassword = () => {
    if (passwordResetUserId && onResetPassword) {
      onResetPassword(passwordResetUserId);
      setPasswordResetUserId(null);
    }
  };

  const cancelResetPassword = () => {
    setPasswordResetUserId(null);
  };

  const handleRequestAction = (memberId: string, action: 'suspend' | 'reactivate') => {
    if (onRequestAction) {
      onRequestAction(memberId, action);
    }
  };
  
  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };
  
  const handleSelectAllMembers = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(currentMembers.map(member => member.id));
    } else {
      setSelectedMembers([]);
    }
  };
  
  const handleBulkAction = (action: 'activate' | 'suspend') => {
    setBulkActionDialog({
      open: true,
      action: action
    });
  };
  
  const executeBulkAction = () => {
    if (!bulkActionDialog.action) return;
    
    const status = bulkActionDialog.action === 'activate' ? 'active' : 'suspended';
    
    selectedMembers.forEach(memberId => {
      onStatusChange(memberId, status as 'active' | 'inactive' | 'suspended');
    });
    
    setBulkActionDialog({ open: false, action: null });
    setSelectedMembers([]);
  };

  return (
    <div className="space-y-4">
      {selectedMembers.length > 0 && (
        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedMembers.length} members selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => handleBulkAction('activate')}
            >
              <UserCheck className="h-4 w-4" />
              Activate Selected
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1 text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => handleBulkAction('suspend')}
            >
              <Ban className="h-4 w-4" />
              Suspend Selected
            </Button>
          </div>
        </div>
      )}
        
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={
                    currentMembers.length > 0 && 
                    selectedMembers.length === currentMembers.length
                  }
                  onCheckedChange={handleSelectAllMembers}
                  aria-label="Select all members"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Days Active</TableHead>
              <TableHead>Total Earned</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              currentMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => 
                        handleSelectMember(member.id, checked as boolean)
                      }
                      aria-label={`Select ${member.name}`}
                    />
                  </TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    {member.status === 'active' && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                    {member.status === 'inactive' && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Inactive
                      </Badge>
                    )}
                    {member.status === 'suspended' && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell>{member.joinDate}</TableCell>
                  <TableCell>{member.lastActive}</TableCell>
                  <TableCell>{member.daysActive}</TableCell>
                  <TableCell>₹{member.totalEarned}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onRequestAction ? (
                          <>
                            {member.status !== 'suspended' && (
                              <DropdownMenuItem 
                                onClick={() => handleRequestAction(member.id, 'suspend')}
                                className="text-red-600"
                              >
                                Request Suspension
                              </DropdownMenuItem>
                            )}
                            {member.status === 'suspended' && (
                              <DropdownMenuItem 
                                onClick={() => handleRequestAction(member.id, 'reactivate')}
                                className="text-green-600"
                              >
                                Request Reactivation
                              </DropdownMenuItem>
                            )}
                          </>
                        ) : (
                          <>
                            {member.status !== 'active' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(member.id, 'active')}
                                className="text-green-600"
                              >
                                Activate
                              </DropdownMenuItem>
                            )}
                            {member.status !== 'suspended' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(member.id, 'suspended')}
                                className="text-red-600"
                              >
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {onResetPassword && (
                          <DropdownMenuItem 
                            onClick={() => handleResetPassword(member.id)}
                            className="flex items-center"
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Items per page</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {teamMembers.length}
            </span>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {getPageNumbers().map((pageNumber, index) => (
                <PaginationItem key={`page-${index}`}>
                  {pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2' ? (
                    <span className="px-4 py-2">...</span>
                  ) : (
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => handlePageChange(Number(pageNumber))}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AlertDialog open={!!passwordResetUserId} onOpenChange={() => setPasswordResetUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this user's password? They will need to create a new password on their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelResetPassword}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>Reset Password</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={bulkActionDialog.open} 
        onOpenChange={(isOpen) => !isOpen && setBulkActionDialog({ open: false, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionDialog.action === 'activate' 
                ? 'Activate Selected Members' 
                : 'Suspend Selected Members'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionDialog.action === 'activate' 
                ? 'Are you sure you want to activate the selected members?' 
                : 'Are you sure you want to suspend the selected members? They will not be able to access the system until reactivated.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              {bulkActionDialog.action === 'activate' ? 'Activate' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamMembersTable;
