import './globals.css';
import Link from 'next/link';
import { Bot, Sparkles, Terminal, Cpu, Activity, Github } from 'lucide-react';

export const metadata = {
  title: 'Gemini AI Studio & C++ Engine | Full-Stack Chatbot',
  description: 'Enterprise-grade full-stack conversational AI interface powered by Google Gemini API and high-performance C++20 backend architecture.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-ambient" aria-hidden="true" />
        
        {/* Navigation Bar */}
        <header className="navbar">
          <Link href="/" className="navbar-brand">
            <div className="brand-gem">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="brand-text">Gemini</span>
              <span style={{ color: 'var(--accent-cyan)', marginLeft: '4px' }}>Studio</span>
            </div>
            <span className="brand-badge">C++20 & Fullstack</span>
          </Link>

          <nav className="nav-links">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/chat" className="nav-link">
              Playground
            </Link>
            <Link href="/architecture" className="nav-link">
              Architecture
            </Link>
            <Link href="/benchmarks" className="nav-link">
              Benchmarks
            </Link>
          </nav>

          <div className="nav-actions">
            <Link
              href="/chat"
              className="btn btn-primary"
            >
              <Bot size={16} />
              <span>Launch Chat</span>
            </Link>
            <a
              href="https://github.com/om31gosavi-star/gemini-terminal-chatbot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              title="View on GitHub"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </header>

        {/* Main View */}
        <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 140px)' }}>
          {children}
        </main>

        {/* Global Footer */}
        <footer style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 2rem',
          background: 'rgba(7, 9, 14, 0.95)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Gemini Studio</span>
            <span>•</span>
            <span>Full-Stack Next.js & Modern C++20 Core</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="/architecture" style={{ color: 'var(--text-secondary)' }}>
              OOP Architecture
            </Link>
            <Link href="/benchmarks" style={{ color: 'var(--text-secondary)' }}>
              API Benchmarks
            </Link>
            <a
              href="https://github.com/om31gosavi-star/gemini-terminal-chatbot"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Source Code
            </a>
          </div>

          <div>
            Hosted seamlessly on <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Vercel</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
