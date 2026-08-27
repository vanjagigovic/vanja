import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId: string;
  userId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function setRequestContext(context: RequestContext): void {
  asyncLocalStorage.enterWith(context);
}

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.correlationId;
}

export function setUserId(userId: string): void {
  const context = asyncLocalStorage.getStore();
  if (context) {
    context.userId = userId;
  }
}

export function getUserId(): string | undefined {
  return asyncLocalStorage.getStore()?.userId;
}
