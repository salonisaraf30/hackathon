import { AsyncLocalStorage } from 'node:async_hooks';

export type TraceContext = {
  requestId: string;
  userId?: string;
  route?: string;
};

const traceStorage = new AsyncLocalStorage<TraceContext>();

export function withTraceContext<T>(context: TraceContext, run: () => Promise<T>): Promise<T> {
  return traceStorage.run(context, run);
}

export function getTraceContext(): TraceContext | undefined {
  return traceStorage.getStore();
}
