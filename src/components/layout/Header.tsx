import { Bell, Settings, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import revonnLogo from '@/assets/revonn-logo.jpeg';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img 
            src={revonnLogo} 
            alt="Revonn" 
            className="w-9 h-9 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {title || 'Revonn'}
            </h1>
            <p className="text-xs text-muted-foreground">Business Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-secondary transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <Link 
            to="/settings"
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
