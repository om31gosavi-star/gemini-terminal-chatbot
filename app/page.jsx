import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Code2,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const samplePrompts = [
    {
      label: 'C++ Architecture',
      query: 'Explain the RAII pattern used in libcurl and how exceptions guarantee safety.',
    },
    {
      label: 'Gemini Capabilities',
      query: 'What are the main architectural differences between Gemini 2.5 Flash and Gemini 1.5 Pro?',
    },
    {
      label: 'Code Generation',
      query: 'Write a thread-safe sliding-window conversation memory buffer in modern C++20.',
    },
    {
      label: 'System Design',
      query: 'How does an OOP client gracefully handle network timeouts and HTTP 429 rate limits?',
    },
  ];

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3rem 1rem 4rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#c4b5fd',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.75rem',
        }}>
          <Sparkles size={16} />
          <span>Full-Stack Next.js 15 & Native C++20 Engine</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.5rem, 6vw, 4.25rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
        }}>
          The Intelligent Dual-Engine <br />
          <span style={{
            background: 'var(--grad-gemini)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Gemini AI Chatbot
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '750px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6,
        }}>
          A high-performance conversational intelligence platform. Access state-of-the-art
          Google Gemini models through an interactive full-stack web studio, backed by a strict
          Object-Oriented C++20 terminal engine.
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Link
            href="/chat"
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.8rem', fontSize: '1.05rem', borderRadius: '12px' }}
          >
            <Bot size={20} />
            <span>Launch Web Studio</span>
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/architecture"
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.8rem', fontSize: '1.05rem', borderRadius: '12px' }}
          >
            <Cpu size={20} />
            <span>Inspect C++ Core</span>
          </Link>
        </div>
      </section>

      {/* Dual Engine Showcase Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '5rem',
      }}>
        {/* Web Studio Card */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-cyan)',
            marginBottom: '1.25rem',
          }}>
            <Bot size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            Full-Stack Web Playground
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            A modern, responsive web application hosted on Vercel. Features real-time responses,
            rich markdown syntax highlighting, interactive model switching, and customizable system prompts.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
            {[
              'Next.js 15 App Router & Serverless API Routes',
              'Multi-turn conversation memory with rollback',
              'Real-time response latency & token tracking',
              'Custom API Key management with client persistence',
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link href="/chat" style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Open Playground</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* C++ Terminal Engine Card */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--accent-purple)',
            marginBottom: '1.25rem',
          }}>
            <Terminal size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            C++20 Terminal Architecture
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            A high-performance command-line engine built with strict Object-Oriented principles.
            Employs RAII libcurl transports, thread-safe memory buffers, and custom exception handling.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
            {[
              'Strict OOP separation: APIClient, ChatContext, ChatEngine',
              'CURLSSLOPT_NATIVE_CA Windows store integration',
              'Granular Exception Hierarchy (Timeouts, API Keys, JSON)',
              'Thread-safe sliding-window turn pruning',
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} color="var(--accent-purple)" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link href="/architecture" style={{ color: 'var(--accent-purple)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Explore C++ Code</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Quick Starter Prompts */}
      <section style={{ marginBottom: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Try a Quick Prompt
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Click any topic below to jump directly into the live studio.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {samplePrompts.map((p, idx) => (
            <Link
              key={idx}
              href={`/chat?q=${encodeURIComponent(p.query)}`}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}>
                  {p.label}
                </span>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  "{p.query}"
                </p>
              </div>
              <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Ask Gemini</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Badges Grid */}
      <section style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '3rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2rem',
        textAlign: 'center',
      }}>
        <div>
          <div style={{ color: 'var(--accent-purple)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Zap size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Sub-Second Latency</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Gemini 2.5 Flash streaming via optimized REST connections.
          </p>
        </div>

        <div>
          <div style={{ color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Layers size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Multi-Turn Context</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Sliding-window history preserves context without token overflows.
          </p>
        </div>

        <div>
          <div style={{ color: 'var(--accent-emerald)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <ShieldCheck size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Fault-Tolerant</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Graceful handling of rate limits, timeouts, and API key issues.
          </p>
        </div>

        <div>
          <div style={{ color: 'var(--accent-blue)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Code2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Strict OOP Design</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Modern C++20 header/source decoupling with zero compiler warnings.
          </p>
        </div>
      </section>
    </div>
  );
}
