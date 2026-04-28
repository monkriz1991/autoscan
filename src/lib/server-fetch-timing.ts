/**
 * Замер длительности серверных fetch (RSC) — только в development, для профилирования.
 */
export async function logSsrFetchMs<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return fn();
  }
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    const ms = Math.round(performance.now() - t0);
    // eslint-disable-next-line no-console -- намеренный dev-лог
    console.info(`[SSR fetch] ${label}: ${ms}ms`);
  }
}
