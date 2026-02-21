import { Bell, Menu, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import NotificationBadge from '@/components/NotificationBadge';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#F0B90B] rounded-full flex items-center justify-center">
              <span className="text-[#0B0E11] font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-xl text-[#EAECEF]">Kryvex</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBadge 
                  onClick={() => {
                    // Navigate to notifications page or open notifications modal
                    window.location.href = '/account?tab=notifications';
                  }}
                  className="p-2 hover:bg-[#23262F] rounded-xl transition-colors"
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center space-x-2 p-2 hover:bg-muted rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium">
                        {user?.first_name} {user?.last_name}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {t('Account Settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('Dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          await logout();
                          toast({
                            title: t('Logged Out'),
                            description: t('You have been successfully logged out.'),
                          });
                        } catch (error) {
                          toast({
                            title: t('Logout Failed'),
                            description: t('Failed to log out. Please try again.'),
                            variant: "destructive",
                          });
                        }
                      }}
                      className="flex items-center text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('Log Out')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button className="bg-transparent hover:bg-muted">
                    {t('Sign In')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    {t('Get Started')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}