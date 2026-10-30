import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      messages = [],
      systemInstruction = '',
      model = 'gemini-2.5-flash',
      generationConfig = {},
      apiKey: customApiKey = '',
    } = body;

    // Use user-provided API key from client or server environment variable
    const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing Google Gemini API Key.',
          details:
            'Please provide your API key in the settings drawer or configure the GEMINI_API_KEY environment variable on Vercel.',
          code: 'MISSING_API_KEY',
        },
        { status: 401 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation messages array is required.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Format messages for Google Gemini v1beta REST API
    const contents = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }],
      }));

    // Ensure conversation starts with a user message for Gemini API requirements
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { error: 'Conversation must include at least one user message.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Prepare Gemini request payload
    const payload = {
      contents,
    };

    if (systemInstruction && systemInstruction.trim().length > 0) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction.trim() }],
      };
    }

    // Apply generation configuration
    const config = {};
    if (typeof generationConfig.temperature === 'number') {
      config.temperature = generationConfig.temperature;
    }
    if (typeof generationConfig.topP === 'number') {
      config.topP = generationConfig.topP;
    }
    if (typeof generationConfig.topK === 'number') {
      config.topK = generationConfig.topK;
    }
    if (typeof generationConfig.maxOutputTokens === 'number') {
      config.maxOutputTokens = generationConfig.maxOutputTokens;
    }
    if (Object.keys(config).length > 0) {
      payload.generationConfig = config;
    }

    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GeminiFullStackChatbot/1.0',
      },
      body: JSON.stringify(payload),
    });

    const latencyMs = Date.now() - startTime;
    const responseData = await response.json();

    if (!response.ok) {
      const errorObj = responseData?.error || {};
      const status = errorObj.status || `HTTP_${response.status}`;
      const message = errorObj.message || 'Error returned by Gemini API.';

      // Specific classification
      if (response.status === 400 && message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'Invalid Gemini API Key.',
            details: message,
            code: 'API_KEY_INVALID',
            latencyMs,
          },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Gemini API Rate Limit Exceeded.',
            details: 'Quota exhausted or too many requests. Please wait a moment before retrying.',
            code: 'RATE_LIMIT_EXCEEDED',
            latencyMs,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Gemini API Error (${status})`,
          details: message,
          code: status,
          latencyMs,
        },
        { status: response.status }
      );
    }

    // Check for safety filter blocks
    if (responseData.promptFeedback?.blockReason) {
      return NextResponse.json(
        {
          error: 'Prompt Blocked by Safety Filters',
          details: `Reason: ${responseData.promptFeedback.blockReason}`,
          code: 'SAFETY_BLOCKED',
          latencyMs,
        },
        { status: 400 }
      );
    }

    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      return NextResponse.json(
        {
          error: 'No generation candidate returned by Gemini.',
          code: 'EMPTY_CANDIDATE',
          latencyMs,
        },
        { status: 500 }
      );
    }

    if (candidate.finishReason === 'SAFETY') {
      return NextResponse.json(
        {
          error: 'Response Filtered by Safety Policies',
          details: 'The model stopped generation due to content safety thresholds.',
          code: 'CONTENT_FILTERED',
          latencyMs,
        },
        { status: 400 }
      );
    }

    const reply = candidate.content?.parts?.map((p) => p.text || '').join('') || '';
    const usage = responseData.usageMetadata || {};

    return NextResponse.json({
      reply,
      model,
      latencyMs,
      finishReason: candidate.finishReason || 'STOP',
      usage: {
        promptTokenCount: usage.promptTokenCount || 0,
        candidatesTokenCount: usage.candidatesTokenCount || 0,
        totalTokenCount: usage.totalTokenCount || 0,
      },
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: err.message || 'An unexpected error occurred during request processing.',
        latencyMs,
      },
      { status: 500 }
    );
  }
}
