import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { PenSquare, LogOut, User, Moon, Sun } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link to="/" className="flex items-center flex-shrink-0" data-testid="logo-link">
            <h1 className="font-serif font-bold text-2xl text-primary">Oyun Yazarları</h1>
          </Link>
          
          <div className="flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted active:scale-95 transition-all"
              data-testid="theme-toggle"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {user ? (
              <>
                <Button
                  onClick={() => navigate('/create')}
                  className="rounded-full font-medium bg-primary hover:bg-primary/90 active:scale-95 transition-all"
                  data-testid="create-review-btn"
                >
                  <PenSquare className="w-4 h-4 mr-2" />
                  İnceleme Yaz
                </Button>
                <Button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  variant="ghost"
                  className="rounded-full hover:bg-muted active:scale-95 transition-all"
                  data-testid="profile-btn"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="rounded-full hover:bg-muted active:scale-95 transition-all"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="rounded-full font-medium bg-primary hover:bg-primary/90 active:scale-95 transition-all"
                data-testid="login-btn"
              >
                Giriş Yap
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};