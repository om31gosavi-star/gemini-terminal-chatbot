'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Layers,
  ShieldAlert,
  Terminal,
  Code2,
  CheckCircle,
  ArrowRight,
  GitBranch,
  Copy,
  Check,
} from 'lucide-react';

const CLASSES = [
  {
    id: 'APIClient',
    name: 'gemini::APIClient',
    header: 'include/APIClient.h',
    source: 'src/APIClient.cpp',
    badge: 'Network & REST',
    description:
      'Manages HTTP POST communication with the Gemini v1beta API endpoint using libcurl and parses incoming JSON responses via nlohmann/json.',
    patterns: ['RAII Singleton (CurlGlobalInit)', 'Rule of 5 Move Semantics', 'Windows Native CA Store'],
    methods: [
      'sendChatRequest(const nlohmann::json& payload) -> std::string',
      'setGenerationConfig(GenerationConfig config)',
      'setTimeout(long timeoutSeconds)',
      'setModel(std::string_view modelName)',
    ],
    codeSnippet: `class APIClient {
public:
    explicit APIClient(std::string apiKey,
                       std::string modelName = "gemini-2.5-flash",
                       long timeoutSeconds = 30);
    ~APIClient();

    [[nodiscard]] std::string sendChatRequest(const nlohmann::json& payload);

    void setModel(std::string_view modelName);
    void setTimeout(long timeoutSeconds) noexcept;
    void setGenerationConfig(GenerationConfig config);

private:
    std::string buildRequestUrl() const;
    std::string executeHttpPost(const std::string& url, const std::string& postBody);
    std::string parseModelResponse(const std::string& responseBody) const;
    void handleHttpError(long httpCode, const std::string& responseBody) const;

    CURL* curlHandle_{nullptr};
};`,
  },
  {
    id: 'ChatContext',
    name: 'gemini::ChatContext',
    header: 'include/ChatContext.h',
    source: 'src/ChatContext.cpp',
    badge: 'Memory & State',
    description:
      'Stores ongoing multi-turn conversational history, manages system instruction personas, and formats payloads for Gemini API schema.',
    patterns: ['Thread-Safety (std::mutex)', 'Sliding-Window Turn Pruning', 'JSON Persistence (Save/Load)'],
    methods: [
      'addUserMessage(std::string_view text)',
      'addModelMessage(std::string_view text)',
      'toGeminiPayload() const -> nlohmann::json',
      'popLastMessage() -> bool',
      'saveToFile(const std::string& path) const',
    ],
    codeSnippet: `class ChatContext {
public:
    explicit ChatContext(size_t maxTurns = 50);

    void addUserMessage(std::string_view text);
    void addModelMessage(std::string_view text);
    void setSystemInstruction(std::string_view instruction);

    [[nodiscard]] nlohmann::json toGeminiPayload() const;
    [[nodiscard]] std::vector<ChatMessage> getHistory() const;
    bool popLastMessage();

    bool saveToFile(const std::string& filePath) const;
    bool loadFromFile(const std::string& filePath);

private:
    void pruneHistoryIfNeeded();

    mutable std::mutex mutex_;
    std::vector<ChatMessage> history_;
    std::string systemInstruction_;
    size_t maxTurns_{50};
};`,
  },
  {
    id: 'ChatEngine',
    name: 'gemini::ChatEngine',
    header: 'include/ChatEngine.h',
    source: 'src/ChatEngine.cpp',
    badge: 'Controller & CLI',
    description:
      'The core orchestrator managing user terminal input/output, interactive slash commands, ANSI color formatting, and exception recovery.',
    patterns: ['Dependency Injection', 'Command Pattern (/help, /clear, /model)', 'Virtual Terminal Processing'],
    methods: [
      'run() -> Interactive Loop',
      'processInput(const std::string& input) -> bool',
      'handleCommand(std::string_view commandLine)',
      'stop()',
    ],
    codeSnippet: `class ChatEngine {
public:
    ChatEngine(std::shared_ptr<APIClient> apiClient,
               std::shared_ptr<ChatContext> context);

    void run();
    void stop();
    bool processInput(const std::string& input);

private:
    void setupConsole() const;
    bool handleCommand(std::string_view commandLine);
    void reportNetworkError(const NetworkException& e) const;
    void reportApiError(const ApiException& e) const;

    std::shared_ptr<APIClient> apiClient_;
    std::shared_ptr<ChatContext> context_;
};`,
  },
  {
    id: 'Exceptions',
    name: 'gemini::Exceptions',
    header: 'include/Exceptions.h',
    source: 'Header-only',
    badge: 'Fault Tolerance',
    description:
      'Polymorphic exception tree rooted at GeminiException (std::runtime_error), classifying network timeouts, HTTP codes, and JSON errors.',
    patterns: ['Polymorphic Tree', 'Granular Classifiers (isInvalidApiKey, isTimeout)', 'Context-Preserving Rollback'],
    methods: [
      'NetworkException (timeouts & curl error codes)',
      'ApiException (HTTP status & Gemini error parsing)',
      'JsonParseException (missing candidate structure)',
      'ConfigurationException (missing API credentials)',
    ],
    codeSnippet: `class GeminiException : public std::runtime_error { /* ... */ };

class NetworkException : public GeminiException {
public:
    NetworkException(std::string msg, long curlCode, bool isTimeout, std::string endpoint);
    [[nodiscard]] bool isTimeout() const noexcept;
    [[nodiscard]] long getCurlCode() const noexcept;
};

class ApiException : public GeminiException {
public:
    ApiException(int code, std::string status, std::string msg, std::string rawResponse);
    [[nodiscard]] bool isInvalidApiKey() const noexcept;
    [[nodiscard]] bool isRateLimited() const noexcept;
    [[nodiscard]] bool isServerError() const noexcept;
};`,
  },
];

export default function ArchitecturePage() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedClass.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: 'var(--accent-cyan)',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          <Cpu size={15} />
          <span>Object-Oriented Architecture (C++20 & Next.js)</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          System Architecture & OOP Design
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', fontSize: '1rem' }}>
          Explore the decoupled component hierarchy, design patterns, RAII transport wrappers,
          and robust exception recovery implemented in this project.
        </p>
      </div>

      {/* Class Selector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '3rem',
      }}>
        {CLASSES.map((cls) => {
          const isSelected = selectedClass.id === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-card)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: isSelected ? '#c4b5fd' : 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {cls.badge}
                </span>
                <Code2 size={16} color={isSelected ? 'var(--accent-purple)' : 'var(--text-muted)'} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                {cls.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {cls.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Class Deep Dive */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem',
          marginBottom: '1.75rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem' }}>
                {selectedClass.name}
              </h2>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
              }}>
                {selectedClass.header}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {selectedClass.description}
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
          >
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied C++' : 'Copy C++'}</span>
          </button>
        </div>

        {/* Highlights & Methods */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          <div>
            <h4 style={{ fontSize: '0.88rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Key Design Patterns
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedClass.patterns.map((p, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={15} color="var(--accent-purple)" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Core Public Methods
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {selectedClass.methods.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    color: '#e2e8f0',
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C++ Code Box */}
        <div>
          <h4 style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Interface Definition ({selectedClass.header})
          </h4>
          <pre style={{
            background: '#04060a',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.84rem',
            color: '#38bdf8',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>
            <code>{selectedClass.codeSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
