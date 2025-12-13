import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  BarChart3,
  MessageSquare,
  Users2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Package, label: 'Stock', path: '/inventory' },
  { icon: FileText, label: 'Billing', path: '/billing' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Users2, label: 'Staff', path: '/staff' },
];

export function BottomNav() {
  const location = useLocation();
  const { setIsAIOpen } = useAppStore();

  return (
    <>
      {/* AI FAB Button */}
      <button
        onClick={() => setIsAIOpen(true)}
        className="fab animate-pulse-gold"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 px-4 pb-4">
        <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-lg">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                  <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
