import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { useVoiceRecognition, speakText } from '@/hooks/useVoiceRecognition';
import { supabase } from '@/integrations/supabase/client';
import type { AIMessage } from '@/types';
import { cn } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function AIAssistant() {
  const navigate = useNavigate();
  const { isAIOpen, setIsAIOpen } = useAppStore();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Revonn AI Assistant. 👋\n\nMain aapki madad kar sakta hoon:\n\n• Stock check karna\n• Sales & profit reports\n• Bills banana (voice se bhi!)\n• Marketing messages\n• Customer history\n• Staff attendance\n\nBoliye ya type kijiye!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, transcript, toggleListening, stopListening } = useVoiceRecognition({
    lang: 'hi-IN',
    onResult: (result) => {
      if (result.isFinal) {
        setInput(result.transcript);
        stopListening();
        // Auto-send after voice input
        setTimeout(() => handleSend(result.transcript), 500);
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (isAIOpen) inputRef.current?.focus();
  }, [isAIOpen]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const detectLanguage = (text: string): 'hindi' | 'english' => {
    const hindiPattern = /[\u0900-\u097F]|kya|hai|kaise|kitna|kitni|mera|aaj|kal|hoon|karo|batao|dikhao|banao/i;
    return hindiPattern.test(text) ? 'hindi' : 'english';
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Call AI edge function with streaming
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.role !== 'assistant' || m.id !== '1').map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: messageText }
          ],
          context: {
            timestamp: new Date().toISOString(),
            language: detectLanguage(messageText)
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI service error');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Incomplete JSON, wait for more data
            }
          }
        }
      }

      // Add final message
      const finalContent = fullContent || 'I apologize, I could not generate a response.';
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      
      // Speak response
      const lang = detectLanguage(messageText);
      speakText(finalContent.replace(/[*#\[\]{}]/g, '').slice(0, 500), lang === 'hindi' ? 'hi-IN' : 'en-IN');

      // Check for actions in response
      try {
        const actionMatch = finalContent.match(/\{"action":\s*"([^"]+)"[^}]*\}/);
        if (actionMatch) {
          const actionData = JSON.parse(actionMatch[0]);
          if (actionData.action === 'create_bill') {
            setTimeout(() => { setIsAIOpen(false); navigate('/billing'); }, 1500);
          } else if (actionData.action === 'navigate' && actionData.path) {
            setTimeout(() => { setIsAIOpen(false); navigate(actionData.path); }, 1500);
          }
        }
      } catch {
        // No action found, continue
      }

    } catch (error) {
      console.error('AI error:', error);
      const lang = detectLanguage(messageText);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'hindi' 
          ? "Maaf kijiye, abhi kuch problem hai. Thodi der baad try kijiye." 
          : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Aaj ki sale?', icon: '📊' },
    { label: 'Low stock', icon: '📦' },
    { label: 'Bill banao', icon: '🧾' },
    { label: 'Aaj ka profit', icon: '💰' },
    { label: 'Top selling', icon: '🔥' }
  ];

  if (!isAIOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-x-0 bottom-0 h-[85vh] bg-card rounded-t-3xl shadow-2xl border-t border-border animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center animate-pulse-gold">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Revonn AI</h2>
              <p className="text-xs text-muted-foreground">
                {isListening ? '🎤 Listening...' : 'Voice + Text • Hindi/English'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsAIOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                message.role === 'user' ? 'user-bubble' : 'ai-bubble',
                'animate-scale-in max-w-[85%]'
              )}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Streaming content */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="ai-bubble animate-scale-in max-w-[85%]">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
              </div>
            </div>
          )}
          
          {isLoading && !streamingContent && (
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
              onClick={() => { setInput(action.label); inputRef.current?.focus(); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground whitespace-nowrap hover:bg-secondary/80 transition-colors flex items-center gap-1"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          {isListening && (
            <div className="mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Listening... Speak now
              </p>
              {transcript && <p className="text-xs text-muted-foreground mt-1">{transcript}</p>}
            </div>
          )}
          <div className="flex items-center gap-2">
            {isSupported && (
              <button
                onClick={toggleListening}
                className={cn(
                  'p-3 rounded-xl transition-all',
                  isListening 
                    ? 'bg-primary text-primary-foreground animate-pulse' 
                    : 'bg-secondary hover:bg-secondary/80'
                )}
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
              placeholder="Type or speak... / Boliye ya likhiye..."
              className="input-field flex-1"
              disabled={isLoading}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading} 
              className="p-3 rounded-xl btn-gold disabled:opacity-50 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
