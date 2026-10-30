import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const models = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      tag: 'Recommended / Fastest',
      description: 'Ultra-fast, state-of-the-art multimodal reasoning with sub-second response times.',
      contextWindow: '1M tokens',
      speed: '⚡⚡⚡ Super Fast (~400ms)',
      isDefault: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      tag: 'Complex Reasoning',
      description: 'Advanced reasoning, deep coding analysis, and 2M token context window support.',
      contextWindow: '2M tokens',
      speed: '⚡ Fast (~1.2s)',
      isDefault: false,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      tag: 'High Throughput',
      description: 'Optimized for high-volume conversational workloads and low operational costs.',
      contextWindow: '1M tokens',
      speed: '⚡⚡⚡ Super Fast (~500ms)',
      isDefault: false,
    },
  ];

  return NextResponse.json({
    models,
    serverHasApiKey: !!process.env.GEMINI_API_KEY,
  });
}
