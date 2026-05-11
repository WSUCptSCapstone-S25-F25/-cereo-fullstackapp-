import React, { useState, useRef, useEffect } from 'react';
import api from './api';
import './ChatbotWidget.css';

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: 'Hi! I\'m the RWC Living Atlas Helper. Ask me anything about the datasets, layers, or features available on this map.',
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/ask', { question: text });
      const answer = res.data?.answer ?? 'Sorry, I couldn\'t get a response.';
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Sorry, something went wrong. Please try again later.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`chatbot-widget${isOpen ? ' chatbot-widget--open' : ''}`}>
      {/* Handle: collapses to right edge; hover slides it in; click toggles panel */}
      <div
        className="chatbot-widget__handle"
        onClick={() => setIsOpen(v => !v)}
        role="button"
        aria-expanded={isOpen}
        aria-label="RWC Living Atlas Helper"
      >
        <span className="chatbot-widget__handle-icon">💬</span>
        <span className="chatbot-widget__handle-label">RWC Living Atlas Helper</span>
        <span className="chatbot-widget__handle-arrow">{isOpen ? '✕' : ''}</span>
      </div>

      {/* Chat panel: toggled by click */}
      <div className="chatbot-widget__panel" aria-hidden={!isOpen}>
        <div className="chatbot-widget__header">
          <span className="chatbot-widget__title">RWC Living Atlas Helper</span>
        </div>

        <div className="chatbot-widget__messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chatbot-widget__msg chatbot-widget__msg--${msg.role}`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="chatbot-widget__msg chatbot-widget__msg--assistant chatbot-widget__msg--typing">
              <span className="chatbot-widget__dot" />
              <span className="chatbot-widget__dot" />
              <span className="chatbot-widget__dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-widget__input-row">
          <textarea
            ref={inputRef}
            className="chatbot-widget__input"
            placeholder="Ask a question…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="chatbot-widget__send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
