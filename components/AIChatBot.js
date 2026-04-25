'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Brain, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am FoodRescue AI. How can I help with your donation today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          border: 'none', boxShadow: '0 8px 32px var(--primary-glow)',
          cursor: 'pointer', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={{
              position: 'fixed', bottom: '6rem', right: '1.5rem',
              width: '380px', height: '500px',
              background: 'var(--surface-2)', backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow)', zIndex: 9998,
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>FoodRescue AI Bot</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Online · Inference Engine Active</div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: m.role === 'user' ? '14px 14px 0 14px' : '14px 14px 14px 0',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--glass)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  color: m.role === 'user' ? 'white' : 'var(--foreground)',
                  fontSize: '0.85rem'
                }}>
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--glass)', padding: '0.5rem 1rem', borderRadius: 14, fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                  Bot is thinking...
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <input 
                className="input" 
                placeholder="Ask about ingredients, routing..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="btn btn-primary" style={{ padding: '0 1rem' }}>
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
