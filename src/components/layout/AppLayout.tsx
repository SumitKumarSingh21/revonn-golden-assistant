import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { AIAssistant } from '@/components/ai/AIAssistant';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
}

export function AppLayout({ children, title, hideNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} />
      
      <main className="pb-24">
        {children}
      </main>
      
      {!hideNav && <BottomNav />}
      <AIAssistant />
    </div>
  );
}
