// lib/intelligence/nemotron-client.ts

import { randomUUID } from 'node:crypto';
import { logTraceEvent } from './trace-logger';

export interface NemotronMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NemotronResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface NemotronCallOptions {
  messages: NemotronMessage[];
  temperature?: number;      // Default 0.3 for analytical, 0.7 for creative
  max_tokens?: number;       // Default 2048
  response_format?: 'json' | 'text'; // When 'json', appends JSON instruction
  agent_name?: string;       // For logging/tracing which agent made the call
}

// Track token usage across agents for cost monitoring
let sessionTokenUsage: Record<string, number> = {};

export function getSessionUsage() {
  return { ...sessionTokenUsage };
}

export function resetSessionUsage() {
  sessionTokenUsage = {};
}

export async function callNemotron(options: NemotronCallOptions): Promise<NemotronResponse> {
  const {
    messages,
    temperature = 0.3,
    max_tokens = 2048,
    response_format = 'text',
    agent_name = 'unknown'
  } = options;

  // If JSON format requested, reinforce it in the last user message
  const processedMessages = [...messages];
  if (response_format === 'json') {
    const lastMsg = processedMessages[processedMessages.length - 1];
    if (lastMsg.role === 'user' && !lastMsg.content.includes('Respond ONLY with valid JSON')) {
      processedMessages[processedMessages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + '\n\nCRITICAL: Respond ONLY with valid JSON. No markdown, no backticks, no explanation outside the JSON.'
      };
    }
  }

  const startTime = Date.now();
  const callId = randomUUID();
  const model = process.env.OPENROUTER_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct';

  await logTraceEvent({
    type: 'llm_call_start',
    agent_name,
    call_id: callId,
    model,
    timestamp: new Date(startTime).toISOString(),
    prompt_chars: processedMessages.reduce((sum, m) => sum + m.content.length, 0),
  });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'CompetitorPulse', // Shows in OpenRouter dashboard
      },
      body: JSON.stringify({
        model,
        messages: processedMessages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      await logTraceEvent({
        type: 'llm_call_error',
        agent_name,
        call_id: callId,
        model,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        status: response.status,
        error: errorBody.slice(0, 500),
      });
      throw new Error(`Nemotron API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Track usage per agent
    sessionTokenUsage[agent_name] = (sessionTokenUsage[agent_name] || 0) + usage.total_tokens;

    await logTraceEvent({
      type: 'llm_call_end',
      agent_name,
      call_id: callId,
      model: data.model || model,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      total_tokens: usage.total_tokens,
      completion_chars: content.length,
    });

    console.log(`[Nemotron:${agent_name}] ${usage.total_tokens} tokens, ${Date.now() - startTime}ms`);

    return { content, usage, model: data.model };
  } catch (error) {
    await logTraceEvent({
      type: 'llm_call_error',
      agent_name,
      call_id: callId,
      model,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      error: (error as Error).message,
    });
    throw error;
  }
}

// Helper to safely parse JSON from Nemotron responses
export function parseNemotronJSON<T>(content: string): T {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error('[Nemotron] Failed to parse JSON:', cleaned.substring(0, 200));
    throw new Error(`Failed to parse Nemotron JSON response: ${(e as Error).message}`);
  }
}
