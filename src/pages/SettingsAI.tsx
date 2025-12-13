import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Sparkles, 
  Mic,
  Volume2,
  Languages,
  Save
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';

export default function SettingsAI() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    enableVoice: true,
    enableSpeech: true,
    preferredLanguage: 'auto',
    useRealAI: false
  });

  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In production, would save to local storage or settings DB
    localStorage.setItem('ai-settings', JSON.stringify(settings));
    toast.success('AI settings saved!');
    navigate(-1);
  };

  return (
    <AppLayout title="AI Settings" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">AI Assistant</h1>
        </div>

        {/* AI Info Card */}
        <div className="p-4 rounded-2xl gold-gradient text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold">Revonn Assistant</h2>
              <p className="text-sm opacity-90">AI-powered business helper</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          {/* Voice Input */}
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Mic className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Voice Input</p>
                <p className="text-sm text-muted-foreground">Speak to give commands</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('enableVoice', !settings.enableVoice)}
              className={`w-12 h-7 rounded-full transition-colors ${
                settings.enableVoice ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.enableVoice ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Text to Speech */}
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Voice Responses</p>
                <p className="text-sm text-muted-foreground">AI speaks responses</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('enableSpeech', !settings.enableSpeech)}
              className={`w-12 h-7 rounded-full transition-colors ${
                settings.enableSpeech ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.enableSpeech ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Language */}
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Languages className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Preferred Language</p>
                <p className="text-sm text-muted-foreground">For AI responses</p>
              </div>
            </div>
            <select
              value={settings.preferredLanguage}
              onChange={(e) => handleChange('preferredLanguage', e.target.value)}
              className="input-field"
            >
              <option value="auto">Auto-detect (Recommended)</option>
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </div>

          {/* Real AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Real AI</p>
                <p className="text-sm text-muted-foreground">Requires API key (Coming soon)</p>
              </div>
            </div>
            <button
              disabled
              className="w-12 h-7 rounded-full bg-muted opacity-50 cursor-not-allowed"
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-1" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-secondary/50 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">💡 Tips</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Say "Aaj ki sale" for today's sales</li>
            <li>Say "Bill banao" to create a bill</li>
            <li>AI understands both Hindi & English</li>
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-xl btn-gold font-semibold text-lg flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>
    </AppLayout>
  );
}
