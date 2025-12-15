import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import revonnLogo from '@/assets/revonn-logo.jpeg';

interface SplashProps {
  onComplete: (isAuthenticated: boolean) => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Show splash for 3 seconds
    const timer = setTimeout(async () => {
      setIsAnimating(false);
      
      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      
      setTimeout(() => {
        onComplete(!!session);
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className={`flex flex-col items-center transition-all duration-500 ${isAnimating ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}>
        {/* Logo with glow animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl animate-pulse-gold blur-xl opacity-60" />
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl relative z-10">
            <img src={revonnLogo} alt="Revonn" className="w-full h-full object-cover" />
          </div>
        </div>
        
        {/* Brand Name */}
        <h1 className="text-4xl font-bold gold-text mt-6 tracking-tight">Revonn</h1>
        <p className="text-muted-foreground mt-2 text-lg">AI-Powered Business OS</p>
        
        {/* Loading indicator */}
        <div className="mt-12 flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground">Making retail smarter</p>
      </div>
    </div>
  );
}