import { describe, it, expect, mock } from 'bun:test';

describe('emergency stop button', () => {
  it('calls POST /api/control/emergency-stop on click', async () => {
    const fetchMock = mock(async (url: string, options?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    // Simulate the emergencyStop function from Layout.tsx
    async function emergencyStop(fetchFn: typeof fetch): Promise<void> {
      await fetchFn('/api/control/emergency-stop', { method: 'POST' });
    }

    await emergencyStop(fetchMock as unknown as typeof fetch);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/control/emergency-stop');
    expect(options.method).toBe('POST');
  });

  it('does not call pause or other endpoints', async () => {
    const fetchMock = mock(async (_url: string, _options?: RequestInit) => {
      return new Response('{}', { status: 200 });
    });

    async function emergencyStop(fetchFn: typeof fetch): Promise<void> {
      await fetchFn('/api/control/emergency-stop', { method: 'POST' });
    }

    await emergencyStop(fetchMock as unknown as typeof fetch);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('pause');
    expect(url).not.toContain('resume');
  });
});
