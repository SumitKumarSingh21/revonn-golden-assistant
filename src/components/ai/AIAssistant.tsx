import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { generateAIResponse, detectLanguage } from '@/lib/ai-assistant';
import { useVoiceRecognition, speakText } from '@/hooks/useVoiceRecognition';
import type { AIMessage } from '@/types';
import { cn } from '@/lib/utils';

export function AIAssistant() {
  const navigate = useNavigate();
  const { isAIOpen, setIsAIOpen } = useAppStore();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Revonn Assistant. 👋\n\nMain aapki madad kar sakta hoon:\n\n• Stock check karna\n• Sales & profit reports\n• Bills banana\n• Marketing messages\n• Customer history\n• Staff attendance\n\nPuchiye ya boliye!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, transcript, toggleListening, stopListening } = useVoiceRecognition({
    lang: 'hi-IN',
    onResult: (result) => {
      if (result.isFinal) {
        setInput(result.transcript);
        stopListening();
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAIOpen) inputRef.current?.focus();
  }, [isAIOpen]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input.trim());
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        action: response.action as AIMessage['action']
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak response
      const lang = detectLanguage(input.trim());
      speakText(response.response.replace(/[*#]/g, ''), lang === 'hindi' ? 'hi-IN' : 'en-IN');

      if (response.action?.type === 'create_bill') {
        setTimeout(() => { setIsAIOpen(false); navigate('/billing'); }, 1500);
      } else if (response.action?.type === 'navigate') {
        setTimeout(() => { setIsAIOpen(false); navigate(response.action?.data?.path || '/'); }, 1500);
      }
    } catch (error) {
      const lang = detectLanguage(input);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'hindi' ? "Maaf kijiye, kuch problem hui." : "Sorry, I encountered an error.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { hi: 'Aaj ki sale?' },
    { hi: 'Low stock' },
    { hi: 'Bill banao' },
    { hi: 'Aaj ka profit' },
    { hi: 'WhatsApp message' }
  ];

  if (!isAIOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-x-0 bottom-0 h-[85vh] bg-card rounded-t-3xl shadow-2xl border-t border-border animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Revonn Assistant</h2>
              <p className="text-xs text-muted-foreground">Voice + Text • Hindi/English</p>
            </div>
          </div>
          <button onClick={() => setIsAIOpen(false)} className="p-2 rounded-xl hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(message.role === 'user' ? 'user-bubble' : 'ai-bubble', 'animate-scale-in max-w-[85%]')}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="ai-bubble flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => { setInput(action.hi); inputRef.current?.focus(); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground whitespace-nowrap hover:bg-secondary/80"
            >
              {action.hi}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          {isListening && (
            <div className="mb-3 p-3 rounded-xl bg-destructive/10 text-center">
              <p className="text-sm text-destructive font-medium animate-pulse">🎤 Listening... Speak now</p>
              {transcript && <p className="text-xs text-muted-foreground mt-1">{transcript}</p>}
            </div>
          )}
          <div className="flex items-center gap-2">
            {isSupported && (
              <button
                onClick={toggleListening}
                className={cn('p-3 rounded-xl transition-colors', isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-secondary')}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Puchiye kuch bhi... / Ask anything..."
              className="input-field flex-1"
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-3 rounded-xl btn-gold disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
