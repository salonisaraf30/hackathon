import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { getTraceContext } from './trace-context';

type TraceEventType = 'llm_call_start' | 'llm_call_end' | 'llm_call_error';

export type TraceEvent = {
  type: TraceEventType;
  agent_name: string;
  call_id: string;
  model?: string;
  timestamp: string;
  duration_ms?: number;
  status?: number;
  prompt_chars?: number;
  completion_chars?: number;
  total_tokens?: number;
  error?: string;
};

const LOG_PATH = join(process.cwd(), 'logs', 'multiagent-trace.jsonl');

export async function logTraceEvent(event: TraceEvent): Promise<void> {
  const context = getTraceContext();
  if (!context?.requestId) return;

  const payload = {
    request_id: context.requestId,
    user_id: context.userId,
    route: context.route,
    ...event,
  };

  try {
    await mkdir(dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (error) {
    console.warn('[TraceLogger] Failed to write trace log:', error);
  }
}
