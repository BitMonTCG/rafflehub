import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Search, Bell, User, Menu, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Header: React.FC = () => {
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
    // Implement search functionality
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-background shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="/images/logo.png" 
                alt="BitMon Logo" 
                className="w-16 h-16 object-contain" 
              />
              <span className="text-2xl font-bold font-montserrat text-foreground">BitMon</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <a className={`font-medium ${location === '/' ? 'text-[#FF5350]' : 'hover:text-[#FF5350] transition-colors'}`}>
                Home
              </a>
            </Link>
            <Link href="/raffles">
              <a className={`font-medium ${location === '/raffles' ? 'text-[#FF5350]' : 'hover:text-[#FF5350] transition-colors'}`}>
                Active Raffles
              </a>
            </Link>
            <Link href="/winners">
              <a className={`font-medium ${location === '/winners' ? 'text-[#FF5350]' : 'hover:text-[#FF5350] transition-colors'}`}>
                Winners
              </a>
            </Link>
            <Link href="/how-it-works">
              <a className={`font-medium ${location === '/how-it-works' ? 'text-[#FF5350]' : 'hover:text-[#FF5350] transition-colors'}`}>
                How It Works
              </a>
            </Link>
          </nav>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {/* Search (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-500" />
              <Input 
                type="text" 
                placeholder="Search cards..." 
                className="bg-transparent border-none outline-none w-40 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                </Button>
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF5350] rounded-full flex items-center justify-center text-white text-xs">
                  2
                </span>
              </div>
            )}
            
            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-1 border border-gray-300 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.username || 'Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets">My Tickets</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" className="text-gray-700">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-[#FF5350] hover:bg-red-600 text-white">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden rounded-full" 
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link href="/">
                <a className={`font-medium ${location === '/' ? 'text-[#FF5350]' : ''}`} onClick={toggleMenu}>
                  Home
                </a>
              </Link>
              <Link href="/raffles">
                <a className={`font-medium ${location === '/raffles' ? 'text-[#FF5350]' : ''}`} onClick={toggleMenu}>
                  Active Raffles
                </a>
              </Link>
              <Link href="/winners">
                <a className={`font-medium ${location === '/winners' ? 'text-[#FF5350]' : ''}`} onClick={toggleMenu}>
                  Winners
                </a>
              </Link>
              <Link href="/how-it-works">
                <a className={`font-medium ${location === '/how-it-works' ? 'text-[#FF5350]' : ''}`} onClick={toggleMenu}>
                  How It Works
                </a>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/profile">
                    <a className="font-medium" onClick={toggleMenu}>Profile</a>
                  </Link>
                  <Link href="/my-tickets">
                    <a className="font-medium" onClick={toggleMenu}>My Tickets</a>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin">
                      <a className="font-medium" onClick={toggleMenu}>Admin Panel</a>
                    </Link>
                  )}
                  <a 
                    className="font-medium text-red-500 cursor-pointer" 
                    onClick={() => {
                      logout();
                      toggleMenu();
                    }}
                  >
                    Logout
                  </a>
                </>
              ) : (
                <div className="flex space-x-4 pt-2">
                  <Button asChild variant="outline" onClick={toggleMenu}>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="bg-[#FF5350] hover:bg-red-600 text-white" onClick={toggleMenu}>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              )}
            </nav>
            
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-4 relative">
              <Input 
                type="text" 
                placeholder="Search cards..." 
                className="bg-gray-100 pr-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 bottom-0"
              >
                <Search className="h-4 w-4 text-gray-500" />
              </Button>
            </form>
            
            {/* Mobile Theme Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
