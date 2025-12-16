import { useState, useCallback, useRef, useEffect } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface UseVoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { 
    lang = 'hi-IN',
    continuous = true, // Changed to true for better continuous listening
    onResult,
    onError,
    onEnd
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManualStop = useRef(false);
  const restartTimeout = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onaudiostart = () => {
        console.log('Audio capturing started');
      };

      recognition.onsoundstart = () => {
        console.log('Sound detected');
      };

      recognition.onspeechstart = () => {
        console.log('Speech detected');
        // Clear silence timeout when speech is detected
        if (silenceTimeout.current) {
          clearTimeout(silenceTimeout.current);
          silenceTimeout.current = null;
        }
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        // Reset silence timeout on any result
        if (silenceTimeout.current) {
          clearTimeout(silenceTimeout.current);
        }
        
        // Set silence timeout - if no new speech for 3 seconds after final result, stop
        if (finalTranscript) {
          silenceTimeout.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              isManualStop.current = true;
              recognitionRef.current.stop();
            }
          }, 2000);
        }
        
        if (finalTranscript && onResult) {
          onResult({ transcript: finalTranscript, isFinal: true });
        } else if (interimTranscript && onResult) {
          onResult({ transcript: interimTranscript, isFinal: false });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't set isListening to false for recoverable errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          // These are recoverable - try to restart if still supposed to be listening
          if (!isManualStop.current && isListening) {
            restartTimeout.current = setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                console.log('Could not restart recognition');
              }
            }, 100);
          }
          return;
        }
        
        setIsListening(false);
        if (onError) {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended, manual stop:', isManualStop.current);
        
        // If not manually stopped and supposed to be listening, restart
        if (!isManualStop.current && isListening) {
          restartTimeout.current = setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Could not restart recognition');
              setIsListening(false);
            }
          }, 100);
        } else {
          setIsListening(false);
          if (onEnd) {
            onEnd();
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        isManualStop.current = true;
        recognitionRef.current.abort();
      }
      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current);
      }
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
      }
    };
  }, [lang, continuous]);

  // Update callbacks when they change
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (silenceTimeout.current) {
          clearTimeout(silenceTimeout.current);
        }
        
        if (finalTranscript) {
          silenceTimeout.current = setTimeout(() => {
            if (recognitionRef.current) {
              isManualStop.current = true;
              recognitionRef.current.stop();
            }
          }, 2000);
        }
        
        if (finalTranscript && onResult) {
          onResult({ transcript: finalTranscript, isFinal: true });
        } else if (interimTranscript && onResult) {
          onResult({ transcript: interimTranscript, isFinal: false });
        }
      };
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      isManualStop.current = false;
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
        // If already started, try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }, 100);
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isManualStop.current = true;
      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current);
        restartTimeout.current = null;
      }
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
        silenceTimeout.current = null;
      }
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening
  };
}

// Speech synthesis for AI responses
export function speakText(text: string, lang: string = 'hi-IN') {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to get a better voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(lang.split('-')[0]) && (v.name.includes('Google') || v.name.includes('Microsoft'))
    ) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
    return true;
  }
  return false;
}

// Window declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
