import { useEffect } from 'react';
import { mockRealtime, EventCallback } from './mockRealtime';

export function useChannel(channel: string | null | undefined, onMessage: EventCallback) {
  useEffect(() => {
    if (!channel) return;
    const unsubscribe = mockRealtime.subscribe(channel, onMessage);
    return () => {
      unsubscribe();
    };
  }, [channel, onMessage]);
}
