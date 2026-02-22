import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type TraceEvent = {
  request_id?: string;
  user_id?: string;
  route?: string;
  type?: 'llm_call_start' | 'llm_call_end' | 'llm_call_error';
  agent_name?: string;
  call_id?: string;
  timestamp?: string;
  duration_ms?: number;
};

type CallInterval = {
  agent: string;
  start: number;
  end: number;
};

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function hasOverlap(intervals: CallInterval[]): boolean {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let latestEnd = -Infinity;
  for (const interval of sorted) {
    if (interval.start < latestEnd) return true;
    latestEnd = Math.max(latestEnd, interval.end);
  }
  return false;
}

async function main() {
  const logPathArg = getArg('--file') || 'logs/multiagent-trace.jsonl';
  const requestFilter = getArg('--request');
  const userFilter = getArg('--user');
  const absolutePath = resolve(logPathArg);

  let content = '';
  try {
    content = await readFile(absolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`No trace log found at ${absolutePath}. Generate a digest first.`);
      return;
    }
    throw error;
  }
  const rows = content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as TraceEvent;
      } catch {
        return null;
      }
    })
    .filter((row): row is TraceEvent => Boolean(row));

  const filtered = rows.filter((row) => {
    if (requestFilter && row.request_id !== requestFilter) return false;
    if (userFilter && row.user_id !== userFilter) return false;
    return true;
  });

  const grouped = new Map<string, TraceEvent[]>();
  for (const row of filtered) {
    const requestId = row.request_id || 'unknown-request';
    const existing = grouped.get(requestId) || [];
    existing.push(row);
    grouped.set(requestId, existing);
  }

  if (grouped.size === 0) {
    console.log('No matching request logs found.');
    return;
  }

  for (const [requestId, events] of grouped.entries()) {
    const starts = new Map<string, TraceEvent>();
    const intervals: CallInterval[] = [];
    const distinctAgents = new Set<string>();
    let llmCalls = 0;

    for (const event of events) {
      const callId = event.call_id;
      if (event.agent_name) distinctAgents.add(event.agent_name);

      if (!callId || !event.timestamp || !event.type) continue;

      if (event.type === 'llm_call_start') {
        starts.set(callId, event);
      }

      if (event.type === 'llm_call_end' || event.type === 'llm_call_error') {
        llmCalls += 1;
        const start = starts.get(callId);
        if (!start?.timestamp) continue;

        const startMs = new Date(start.timestamp).getTime();
        const endMs = new Date(event.timestamp).getTime();
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;

        intervals.push({
          agent: event.agent_name || 'unknown',
          start: startMs,
          end: Math.max(endMs, startMs + 1),
        });
      }
    }

    const overlap = hasOverlap(intervals);
    const effectivelyMultiAgent = distinctAgents.size > 1 || overlap;
    const route = events[0]?.route || 'unknown';
    const userId = events[0]?.user_id || 'unknown';

    console.log(`\nRequest: ${requestId}`);
    console.log(`User: ${userId}`);
    console.log(`Route: ${route}`);
    console.log(`Distinct agents: ${distinctAgents.size} (${[...distinctAgents].join(', ')})`);
    console.log(`LLM calls: ${llmCalls}`);
    console.log(`Overlapping calls: ${overlap ? 'yes' : 'no'}`);
    console.log(`Effective multi-agent: ${effectivelyMultiAgent ? 'YES' : 'NO'}`);
  }
}

main().catch((error) => {
  console.error('Failed to analyze multi-agent logs:', error);
  process.exit(1);
});
