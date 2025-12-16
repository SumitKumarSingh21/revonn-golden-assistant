import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import revonnLogo from '@/assets/revonn-logo.jpeg';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

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
              <p className="text-xs text-muted-foreground">{t('ai_business_os')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-secondary rounded-xl p-1">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  language === 'en' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  language === 'hi' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                हिं
              </button>
            </div>
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
