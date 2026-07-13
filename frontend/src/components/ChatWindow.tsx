import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Globe, Sparkles } from 'lucide-react';
import { apiFetch } from '../services/api';

const renderFormattedMessage = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let isBullet = false;
    let content = line;
    if (line.trim().startsWith('- ')) {
      isBullet = true;
      content = line.substring(line.indexOf('- ') + 2);
    }

    const parts = content.split('**');
    const renderedParts = parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i}>{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <ul key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem', listStyleType: 'disc' }}>
          <li>{renderedParts}</li>
        </ul>
      );
    }

    return (
      <div key={idx} style={{ marginBottom: line.trim() === '' ? '0.5rem' : '0.25rem' }}>
        {renderedParts}
      </div>
    );
  });
};

export const ChatWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: '🏟️ Welcome to StadiumIQ AI! I am your virtual assistant for the FIFA World Cup 2026. How can I help you navigate matches, gates, transit, or accessibility services today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ query: queryText, language })
      });

      setMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `❌ Error: ${err.message || 'Failed to reach AI concierge.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech (Accessibility feature)
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop any active speech
      const cleanText = text.replace(/[^\w\s\d🏟️⚽🚪🚇♿❌.,]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis is not supported in this browser.');
    }
  };

  // Speech-To-Text (Accessibility feature)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            padding: 0
          }}
          aria-label="Open AI Assistant"
        >
          💬
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="glass-card animated-fade"
          style={{
            width: '380px',
            height: '520px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))',
              padding: '1rem',
              borderBottom: '1px solid var(--card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🤖</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Fan AI Assistant</h4>
                <span style={{ fontSize: '0.65rem', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Sparkles size={8} aria-hidden="true" /> Gemini Powered
                </span>
              </div>
            </div>

            {/* Language Picker & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                <Globe size={12} aria-hidden="true" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ background: 'none', border: 'none', color: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                  aria-label="Select Language"
                >
                  <option value="en" style={{ background: 'var(--bg-secondary)' }}>EN</option>
                  <option value="es" style={{ background: 'var(--bg-secondary)' }}>ES</option>
                  <option value="fr" style={{ background: 'var(--bg-secondary)' }}>FR</option>
                </select>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem', padding: '0 4px' }}
                aria-label="Close Assistant"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ padding: '1rem' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.sender === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-ai'}
                style={{ position: 'relative' }}
              >
                <div style={{ fontSize: '0.875rem' }}>{renderFormattedMessage(m.text)}</div>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => speakMessage(m.text)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      position: 'absolute',
                      bottom: '2px',
                      right: '6px'
                    }}
                    title="Read message aloud"
                    aria-label="Read message aloud"
                  >
                    <Volume2 size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--card-border)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about gates, accessibility..."
              className="input-field"
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              disabled={loading}
              aria-label="Type your question"
            />

            <button
              onClick={startListening}
              className={`btn btn-secondary ${isListening ? 'pulse-border' : ''}`}
              style={{
                padding: '0.5rem',
                borderRadius: '50%',
                background: isListening ? 'var(--accent-red)' : 'var(--bg-tertiary)',
                color: isListening ? '#fff' : 'inherit'
              }}
              title="Speak microphone input"
              aria-label="Microphone input"
            >
              <Mic size={16} aria-hidden="true" />
            </button>

            <button
              onClick={() => handleSend()}
              className="btn btn-primary"
              style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px' }}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatWindow;
