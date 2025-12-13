import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import revonnLogo from '@/assets/revonn-logo.jpeg';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-4 mt-3 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src={revonnLogo} 
              alt="Revonn" 
              className="w-10 h-10 rounded-xl object-cover shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {title || 'Revonn'}
              </h1>
              <p className="text-xs text-muted-foreground">AI Business OS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <Link 
              to="/settings"
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
