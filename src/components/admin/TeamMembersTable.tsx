
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
import { Key, MoreHorizontal } from 'lucide-react';
import { TeamMember } from '@/hooks/useTeamMembers';

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  isLoading: boolean;
  onStatusChange: (memberId: string, status: 'active' | 'inactive' | 'suspended') => void;
  onResetPassword?: (memberId: string) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  teamMembers,
  isLoading,
  onStatusChange,
  onResetPassword
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  
  if (isLoading) {
    return <div className="text-center py-8">Loading team members...</div>;
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(teamMembers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, teamMembers.length);
  const currentMembers = teamMembers.slice(startIndex, endIndex);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate middle pages to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust for edge cases
      if (currentPage <= 2) {
        endPage = Math.min(4, totalPages - 1);
      }
      if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push('ellipsis1');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis2');
      }
      
      // Always show last page
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
    setCurrentPage(1); // Reset to first page when changing page size
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={8} className="text-center py-8">
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              currentMembers.map((member) => (
                <TableRow key={member.id}>
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
                        <DropdownMenuItem 
                          onClick={() => handleResetPassword(member.id)}
                          className="flex items-center"
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
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

      {/* Password Reset Confirmation Dialog */}
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
    </div>
  );
};

export default TeamMembersTable;
