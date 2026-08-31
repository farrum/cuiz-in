import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronDown, 
  Check, 
  X, 
  Shield, 
  Crown, 
  Sword, 
  Medal, 
  User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface DropdownMember {
  id: string;
  name: string;
  username?: string;
  role?: string;
  status?: string;
  suspended?: boolean;
  directLeaderUsername?: string;
  directLeaderId?: string;
  [key: string]: any;
}

interface MemberSearchDropdownProps {
  members: DropdownMember[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  className?: string;
  placeholder?: string;
}

export const getRoleInfo = (role?: string) => {
  const r = (role || 'infantry').toLowerCase();
  switch (r) {
    case 'king':
      return {
        label: 'King',
        icon: Crown,
        colorClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
        badgeBg: 'border-amber-400/40 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
        emoji: '👑'
      };
    case 'baron':
    case 'team_leader':
      return {
        label: 'Baron',
        icon: Shield,
        colorClass: 'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400',
        badgeBg: 'border-purple-400/40 text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300',
        emoji: '🛡️'
      };
    case 'knight':
      return {
        label: 'Knight',
        icon: Sword,
        colorClass: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400',
        badgeBg: 'border-blue-400/40 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300',
        emoji: '⚔️'
      };
    case 'officer':
    case 'junior_team_leader':
      return {
        label: 'Officer',
        icon: Medal,
        colorClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
        badgeBg: 'border-emerald-400/40 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
        emoji: '🎖️'
      };
    case 'infantry':
    case 'player':
    default:
      return {
        label: 'Infantry',
        icon: User,
        colorClass: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400',
        badgeBg: 'border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300',
        emoji: '🏹'
      };
  }
};

export const MemberSearchDropdown: React.FC<MemberSearchDropdownProps> = ({
  members = [],
  selectedUserId,
  onSelectUser,
  className = '',
  placeholder = 'Select squad member...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Find currently selected member
  const selectedMember = useMemo(() => {
    if (!selectedUserId) return null;
    return members.find(m => m.id === selectedUserId) || null;
  }, [members, selectedUserId]);

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(m => {
      const name = (m.name || m.username || '').toLowerCase();
      const username = (m.username || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      const leader = (m.directLeaderUsername || '').toLowerCase();
      return name.includes(q) || username.includes(q) || role.includes(q) || leader.includes(q);
    });
  }, [members, searchQuery]);

  const selectedRoleInfo = selectedMember ? getRoleInfo(selectedMember.role) : null;

  return (
    <div ref={dropdownRef} className={`relative inline-block w-full sm:w-auto ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-9 px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center justify-between gap-2 transition-all w-full sm:w-64 bg-white/95 dark:bg-stone-900 shadow-sm hover:bg-slate-50 dark:hover:bg-stone-850 ${
            selectedMember ? 'border-amber-500/40 text-slate-800 dark:text-amber-200' : 'border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 truncate text-left">
            {selectedMember ? (
              <>
                <span className="text-sm">{selectedRoleInfo?.emoji}</span>
                <span className="truncate font-bold text-slate-900 dark:text-slate-100">
                  {selectedMember.name || selectedMember.username}
                </span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border font-bold ${selectedRoleInfo?.badgeBg}`}>
                  {selectedRoleInfo?.label}
                </Badge>
              </>
            ) : (
              <>
                <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  All Squad Members ({members.length})
                </span>
              </>
            )}
          </div>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {selectedMember && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectUser(null);
            }}
            title="Reset to all squad members"
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-stone-800 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1.5 left-0 w-full sm:w-80 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 origin-top-left"
          role="listbox"
        >
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 dark:border-stone-800 bg-slate-50/70 dark:bg-stone-850/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, role or rank..."
                className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-700 rounded-lg focus-visible:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-100/60 dark:divide-stone-800/60">
            {/* Option 1: All Members */}
            {(!searchQuery || 'all squad members'.includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onSelectUser(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  selectedUserId === null 
                    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold' 
                    : 'hover:bg-slate-100/80 dark:hover:bg-stone-800 text-slate-800 dark:text-slate-200'
                }`}
                role="option"
                aria-selected={selectedUserId === null}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      All Squad Members
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      View all {members.length} team members at once
                    </div>
                  </div>
                </div>
                {selectedUserId === null && (
                  <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 ml-2" />
                )}
              </button>
            )}

            {/* Downline Members */}
            {filteredMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No team members match "{searchQuery}"
              </div>
            ) : (
              filteredMembers.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                const isSelected = selectedUserId === member.id;
                const isSuspended = member.suspended || member.status === 'suspended';

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(member.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors pt-1.5 ${
                      isSelected 
                        ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold' 
                        : 'hover:bg-slate-100/80 dark:hover:bg-stone-800 text-slate-800 dark:text-slate-200'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold shrink-0 border ${roleInfo.colorClass}`}>
                        <span className="text-xs">{roleInfo.emoji}</span>
                      </div>
                      <div className="truncate">
                        <div className="font-bold flex items-center gap-1.5 truncate">
                          <span className="truncate">{member.name || member.username}</span>
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 border font-semibold shrink-0 ${roleInfo.badgeBg}`}>
                            {roleInfo.label}
                          </Badge>
                          {isSuspended && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">
                              Suspended
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                          {member.directLeaderUsername && (
                            <span>Under: {member.directLeaderUsername}</span>
                          )}
                          {member.lastActive && member.lastActive !== '-' && (
                            <span className="truncate">• Active {member.lastActive}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSearchDropdown;
