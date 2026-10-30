'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Zap,
  Gauge,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCw,
} from 'lucide-react';

export default function BenchmarksPage() {
  const [pingStatus, setPingStatus] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const testPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      const duration = Math.round(performance.now() - start);

      setPingStatus({
        status: res.ok ? 'Online' : 'Warning',
        duration,
        serverHasKey: data.serverHasApiKey,
        modelCount: data.models?.length || 0,
      });
    } catch (err) {
      setPingStatus({
        status: 'Error',
        error: err.message,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const modelsData = [
    {
      name: 'Gemini 2.5 Flash',
      endpoint: 'gemini-2.5-flash',
      speed: 'Sub-400ms',
      context: '1,048,576 tokens',
      cost: 'Lowest',
      tier: 'Fastest Reasoning',
      idealFor: 'Real-time conversational agents, interactive coding, rapid multi-turn chats.',
      badgeColor: 'var(--accent-purple)',
    },
    {
      name: 'Gemini 1.5 Pro',
      endpoint: 'gemini-1.5-pro',
      speed: '~1,200ms',
      context: '2,097,152 tokens',
      cost: 'Standard',
      tier: 'Deep Reasoning',
      idealFor: 'Massive codebases, whole-repository comprehension, architectural proofs.',
      badgeColor: 'var(--accent-cyan)',
    },
    {
      name: 'Gemini 1.5 Flash',
      endpoint: 'gemini-1.5-flash',
      speed: '~500ms',
      context: '1,048,576 tokens',
      cost: 'Lowest',
      tier: 'High Throughput',
      idealFor: 'High concurrency pipelines, log auditing, low-cost microservices.',
      badgeColor: 'var(--accent-blue)',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          <Activity size={15} />
          <span>Performance & Model Telemetry</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Model Benchmarks & Health
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', fontSize: '1rem' }}>
          Comparative analysis of supported Gemini models, token throughput capabilities,
          context window limits, and real-time API latency health checks.
        </p>
      </div>

      {/* Real-time Latency Diagnostic Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '0.25rem' }}>
              Live Endpoint Latency Test
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Test roundtrip network latency between your client browser, Vercel serverless functions, and Gemini API.
            </p>
          </div>

          <button
            onClick={testPing}
            disabled={isPinging}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <RotateCw size={16} className={isPinging ? 'spin' : ''} />
            <span>{isPinging ? 'Pinging...' : 'Test Ping'}</span>
          </button>
        </div>

        {pingStatus ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</span>
              <p style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '1.1rem' }}>
                ● {pingStatus.status}
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Roundtrip Latency</span>
              <p style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '1.1rem' }}>
                {pingStatus.duration} ms
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Server API Key</span>
              <p style={{ color: pingStatus.serverHasKey ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600 }}>
                {pingStatus.serverHasKey ? 'Configured' : 'Client-key mode'}
              </p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Active Models</span>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {pingStatus.modelCount} Ready
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
          }}>
            Click "Test Ping" above to initiate a real-time network diagnosis.
          </div>
        )}
      </div>

      {/* Model Comparison Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}>
        {modelsData.map((m, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: m.badgeColor,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {m.tier}
                </span>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚡ {m.speed}
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '0.25rem' }}>
                {m.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: '1rem' }}>
                {m.endpoint}
              </p>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {m.idealFor}
              </p>

              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Context Window:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.context}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Relative Cost:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{m.cost}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem' }}>
              <Link
                href="/chat"
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <span>Use {m.name}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
