
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';

interface CustomIcon {
  id: string;
  name: string;
  icon_url: string;
}

interface ProfileIconsListProps {
  selectedAvatar: string;
  customIcons: CustomIcon[];
  onSelectAvatar: (avatar: string) => void;
}

// These are the default avatars, more can be added via the Admin interface
const DEFAULT_AVATARS = [
  { name: 'Person', icon: 'user-round' },
  { name: 'Smile', icon: 'smile' },
  { name: 'Robot', icon: 'robot' },
  { name: 'Graduate', icon: 'graduation-cap' },
  { name: 'Award', icon: 'award' },
];

export const ProfileIconsList: React.FC<ProfileIconsListProps> = ({
  selectedAvatar,
  customIcons,
  onSelectAvatar
}) => {
  const renderAvatarIcon = (iconName: string) => {
    switch (iconName) {
      case 'user-round':
        return <UserRound className="h-full w-full p-4" />;
      case 'smile':
        return <span className="text-3xl">😊</span>;
      case 'robot':
        return <span className="text-3xl">🤖</span>;
      case 'graduation-cap':
        return <span className="text-3xl">🎓</span>;
      case 'award':
        return <span className="text-3xl">🏆</span>;
      default:
        return <UserRound className="h-full w-full p-4" />;
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {DEFAULT_AVATARS.map((avatar) => (
        <div 
          key={avatar.icon} 
          className={`cursor-pointer rounded-md border p-2 flex items-center justify-center h-16 ${
            selectedAvatar === avatar.icon ? 'border-primary ring-2 ring-primary' : 'border-border'
          }`}
          onClick={() => onSelectAvatar(avatar.icon)}
        >
          {renderAvatarIcon(avatar.icon)}
        </div>
      ))}
      
      {customIcons.map((icon) => (
        <div 
          key={icon.id} 
          className={`cursor-pointer rounded-md border p-2 flex items-center justify-center h-16 ${
            selectedAvatar === icon.icon_url ? 'border-primary ring-2 ring-primary' : 'border-border'
          }`}
          onClick={() => onSelectAvatar(icon.icon_url)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={icon.icon_url} alt={icon.name} />
            <AvatarFallback>{icon.name.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  );
};
