
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Target, Users, Shield, List } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const MobileNavLinks: React.FC = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();

  return (
    <nav className="flex flex-col space-y-2">
      <Link to="/" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/' ? 'bg-muted' : ''}`}>
        <Home className="w-5 h-5 mr-3" />
        <span>Home</span>
      </Link>
      
      {user && (
        <>
          <Link to="/quiz" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/quiz' ? 'bg-muted' : ''}`}>
            <Target className="w-5 h-5 mr-3" />
            <span>Quiz</span>
          </Link>
          
          <Link to="/profile" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/profile' ? 'bg-muted' : ''}`}>
            <User className="w-5 h-5 mr-3" />
            <span>Profile</span>
          </Link>
          
          <Link to="/referral" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/referral' ? 'bg-muted' : ''}`}>
            <Users className="w-5 h-5 mr-3" />
            <span>Refer & Earn</span>
          </Link>
          
          {(userRole === 'admin' || userRole === 'team_leader') && (
            <Link to="/team-leader" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/team-leader' ? 'bg-muted' : ''}`}>
              <List className="w-5 h-5 mr-3" />
              <span>Team Dashboard</span>
            </Link>
          )}
          
          {userRole === 'admin' && (
            <Link to="/admin" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/admin' ? 'bg-muted' : ''}`}>
              <Shield className="w-5 h-5 mr-3" />
              <span>Admin Panel</span>
            </Link>
          )}
        </>
      )}
      
      {!user && (
        <Link to="/login" className={`flex items-center px-3 py-2 rounded-md hover:bg-muted ${location.pathname === '/login' ? 'bg-muted' : ''}`}>
          <User className="w-5 h-5 mr-3" />
          <span>Login</span>
        </Link>
      )}
    </nav>
  );
};

export default MobileNavLinks;
