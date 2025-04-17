
import { Link } from 'react-router-dom';

interface MobileNavProps {
  isLoggedIn: boolean;
}

const MobileNav = ({ isLoggedIn }: MobileNavProps) => {
  return (
    <div className="md:hidden bg-background border-b">
      <div className="container px-4 py-3">
        <nav className="flex flex-col space-y-3">
          <Link
            to="/"
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/quiz"
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
          >
            Quiz
          </Link>
          <Link
            to="/categories"
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
          >
            Categories
          </Link>
          <Link
            to="/blog"
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
          >
            Blog
          </Link>
          <Link
            to="/faq"
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
          >
            FAQ
          </Link>
          <Link
            to="/how-to-play"
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
          >
            How To Play
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                to="/referral"
                className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
              >
                Referral
              </Link>
              <Link
                to="/profile"
                className="px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-center"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-2 py-1 rounded-md hover:bg-muted transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-center"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileNav;
