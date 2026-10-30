'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Bot,
  User,
  Trash2,
  Download,
  Settings,
  Sparkles,
  Key,
  Sliders,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Terminal,
  Zap,
} from 'lucide-react';

const PRESET_PERSONAS = [
  {
    name: 'Helpful Assistant',
    prompt: 'You are a helpful, accurate, and concise AI assistant.',
  },
  {
    name: 'Senior C++ Architect',
    prompt:
      'You are a Principal C++ Software Engineer. You write clean, modern C++20 code adhering strictly to OOP best practices, RAII, const-correctness, and zero compiler warnings.',
  },
  {
    name: 'Concise Terminal Bot',
    prompt:
      'You are a high-speed terminal assistant. Provide direct, compact answers without fluff or pleasantries.',
  },
  {
    name: 'Creative Brainstormer',
    prompt:
      'You are an innovative product designer and ideation specialist. Provide rich, structured, and out-of-the-box suggestions.',
  },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        'Hello! I am your Google Gemini AI assistant. How can I assist you with your coding, research, or creative tasks today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // Settings
  const [model, setModel] = useState('gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState(PRESET_PERSONAS[0].prompt);
  const [selectedPersona, setSelectedPersona] = useState(PRESET_PERSONAS[0].name);
  const [temperature, setTemperature] = useState(0.7);
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_CUSTOM_API_KEY');
    if (storedKey) setApiKey(storedKey);

    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [searchParams]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('GEMINI_CUSTOM_API_KEY', newKey);
    } else {
      localStorage.removeItem('GEMINI_CUSTOM_API_KEY');
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    setErrorInfo(null);
    setInput('');

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newHistory,
          systemInstruction: systemPrompt,
          model,
          generationConfig: {
            temperature: parseFloat(temperature),
          },
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate response.');
      }

      const modelMessage = {
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latencyMs: data.latencyMs,
        model: data.model,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      setErrorInfo({
        message: err.message || 'Unknown network error',
        lastPrompt: textToSend,
      });
      // Rollback last user message on failure to maintain synchronous context
      setMessages((prev) => prev.slice(0, -1));
      setInput(textToSend);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([
        {
          role: 'model',
          content: 'Conversation history cleared. How can I help you next?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setErrorInfo(null);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gemini_chat_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      height: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      gap: '1rem',
    }}>
      {/* Top Toolbar */}
      <div className="glass-panel" style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}>
        {/* Model & Persona Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Zap size={16} color="var(--accent-purple)" />
            <span style={{ color: 'var(--text-muted)' }}>Model:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Balanced)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-muted)' }}>Persona:</span>
            <select
              value={selectedPersona}
              onChange={(e) => {
                const p = PRESET_PERSONAS.find((item) => item.name === e.target.value);
                if (p) {
                  setSelectedPersona(p.name);
                  setSystemPrompt(p.prompt);
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {PRESET_PERSONAS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            title="Configure API Key and Temperature"
          >
            <Sliders size={15} />
            <span>Settings</span>
            {apiKey && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />}
          </button>

          <button
            onClick={handleExportJson}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            title="Export transcript to JSON"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            onClick={handleClearChat}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            title="Clear Chat History"
          >
            <Trash2 size={15} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Settings Drawer (Collapsible) */}
      {isSettingsOpen && (
        <div className="glass-panel" style={{
          padding: '1.25rem',
          border: '1px solid var(--border-glow)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              <Key size={15} color="var(--accent-cyan)" />
              <span>Google Gemini API Key (Optional Override)</span>
            </label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
              Leave blank to use the server-side environment key. Your custom key is stored safely in browser localStorage only.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Temperature: {temperature}</label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {temperature < 0.4 ? 'Focused & Deterministic' : temperature > 1.2 ? 'Highly Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-purple)' }}
            />
          </div>
        </div>
      )}

      {/* Main Chat Feed */}
      <div className="glass-panel" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '1rem',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '90%',
              }}
            >
              {/* Avatar */}
              {!isUser && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--grad-gemini)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-glow)',
                  color: 'white',
                }}>
                  <Sparkles size={18} />
                </div>
              )}

              {/* Message Content Container */}
              <div style={{
                background: isUser
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isUser
                  ? '1px solid rgba(59, 130, 246, 0.4)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                boxShadow: isUser ? '0 4px 15px rgba(59, 130, 246, 0.15)' : 'none',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontWeight: 600, color: isUser ? 'var(--accent-cyan)' : '#c4b5fd' }}>
                    {isUser ? 'You' : 'Gemini'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {msg.latencyMs && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent-emerald)' }}>
                        <Clock size={12} />
                        <span>{msg.latencyMs}ms</span>
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => copyToClipboard(msg.content, index)}
                      style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                      title="Copy message text"
                    >
                      {copiedId === index ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="prose" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>

              {isUser && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--accent-cyan)',
                }}>
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--grad-gemini)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              color: 'white',
            }}>
              <Sparkles size={18} />
            </div>
            <div className="glass-panel" style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}>
              <span>✦ Gemini is thinking</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="pulse-1" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
                <span className="pulse-2" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                <span className="pulse-3" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorInfo && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            color: '#fca5a5',
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, fontSize: '0.88rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#f87171' }}>
                Generation Error
              </strong>
              <p style={{ marginBottom: '0.5rem' }}>{errorInfo.message}</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleSendMessage(errorInfo.lastPrompt)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                >
                  <RotateCcw size={13} />
                  <span>Retry Message</span>
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                >
                  <Key size={13} />
                  <span>Update API Key</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="glass-panel" style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.75rem',
        border: '1px solid var(--border-medium)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message to Gemini... (Press Enter to send, Shift+Enter for newline)"
          rows={1}
          style={{
            flex: 1,
            maxHeight: '160px',
            minHeight: '24px',
            resize: 'none',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          className="btn btn-primary"
          style={{
            padding: '0.65rem 1.15rem',
            opacity: !input.trim() || isLoading ? 0.45 : 1,
            cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading Gemini Studio...
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

