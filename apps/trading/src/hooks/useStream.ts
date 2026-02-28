import { useEffect, useCallback, useRef } from 'react';
import type { StreamEvent } from '../types/api';

type StreamHandler = (event: StreamEvent) => void;

export function useStream(onEvent: StreamHandler): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const connect = useCallback(() => {
    const es = new EventSource('/api/stream');

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as StreamEvent;
        handlerRef.current(data);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      // reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    return es;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => {
      es.close();
    };
  }, [connect]);
}
