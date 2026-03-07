/**
 * useInterventions â€” WebSocket hook for real-time AI interventions.
 *
 * Connects to ws://host/api/ws/{documentId}?token=<JWT>
 * and handles streaming for Socratica, Paradosso and Lenti Filosofiche.
 *
 * All LLM responses return JSON â€” we accumulate stream chunks and parse at stream_end.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type InterventionType = 'socratica' | 'paradosso' | 'lente_filosofica';

export type InterventionStatus = 'streaming' | 'done' | 'error';

/** Parsed fields from the JSON responses */
export interface InterventionParsed {
  // socratica
  domanda?: string;
  sottotesto?: string;
  // paradosso
  paradosso?: string;
  nucleo?: string;
  // lente
  lettura?: string;
  spostamento?: string;
}

export interface Intervention {
  id: string;
  type: InterventionType;
  philosopher?: string;
  content: string;           // raw accumulated JSON string (during streaming)
  parsed?: InterventionParsed; // parsed fields (after stream_end)
  triggerExcerpt?: string;   // last paragraph excerpt used to trigger
  status: InterventionStatus;
  modelUsed?: string;
  provider?: string;
  latencyMs?: number;
  createdAt: Date;
}

type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseInterventionsReturn {
  interventions: Intervention[];
  streaming: Intervention | null;
  wsStatus: WsStatus;
  triggerSocratica: (context: string, triggerExcerpt?: string) => void;
  triggerParadosso: (context: string) => void;
  triggerLente: (context: string, philosopher: string, selectedText?: string) => void;
  sendTextActivity: (context: string) => void;
  abort: () => void;
  clearAll: () => void;
  setReaction: (id: string, reaction: 'accept' | 'reject' | 'ignore') => void;
}

const WS_RECONNECT_DELAY_MS = 3000;
const SOCRATICA_DEBOUNCE_MS = 3000;

/** Try to parse the final JSON body from an accumulated LLM stream. */
function parseInterventionJson(raw: string): InterventionParsed | undefined {
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as InterventionParsed;
  } catch {
    return undefined;
  }
}

export function useInterventions(
  documentId: string | undefined,
  token: string | null,
): UseInterventionsReturn {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [streaming, setStreaming] = useState<Intervention | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingRef = useRef<Intervention | null>(null);

  // Keep streaming ref in sync
  streamingRef.current = streaming;

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback(() => {
    if (!documentId || !token) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    setWsStatus('connecting');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws/${documentId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('connected');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        handleMessage(msg);
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => setWsStatus('error');

    ws.onclose = () => {
      setWsStatus('disconnected');
      // Auto-reconnect
      reconnectTimer.current = setTimeout(connect, WS_RECONNECT_DELAY_MS);
    };
  }, [documentId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = (msg: Record<string, unknown>) => {
    const type = msg.type as string;

    if (type === 'stream_start') {
      const iv: Intervention = {
        id: msg.intervention_id as string,
        type: msg.intervention_type as InterventionType,
        content: '',
        status: 'streaming',
        createdAt: new Date(),
        triggerExcerpt: (streamingRef.current as Intervention & { _pendingExcerpt?: string })?._pendingExcerpt,
      };
      setStreaming(iv);
    } else if (type === 'stream_chunk') {
      const chunk = msg.content as string;
      setStreaming((prev) =>
        prev ? { ...prev, content: prev.content + chunk } : prev,
      );
    } else if (type === 'stream_end') {
      setStreaming((prev) => {
        if (!prev) return null;
        const done: Intervention = {
          ...prev,
          status: 'done',
          modelUsed: msg.model_used as string | undefined,
          provider: msg.provider as string | undefined,
          latencyMs: msg.latency_ms as number | undefined,
          parsed: parseInterventionJson(prev.content),
        };
        setInterventions((all) => [done, ...all]);
        return null;
      });
    } else if (type === 'error') {
      setStreaming((prev) => {
        if (!prev) return null;
        const err: Intervention = { ...prev, status: 'error' };
        setInterventions((all) => [err, ...all]);
        return null;
      });
    }
  };

  // Connect/disconnect on mount/unmount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const triggerSocratica = useCallback(
    (context: string, triggerExcerpt?: string) => {
      // Store excerpt so it can be picked up when stream_start fires
      if (streamingRef.current !== null) return;
      const pending = { _pendingExcerpt: triggerExcerpt } as unknown;
      streamingRef.current = pending as Intervention;
      send({ type: 'trigger_socratica', context });
    },
    [send],
  );

  const triggerParadosso = useCallback(
    (context: string) => send({ type: 'trigger_paradosso', context }),
    [send],
  );

  const triggerLente = useCallback(
    (context: string, philosopher: string, selectedText?: string) =>
      send({ type: 'trigger_lente', context, philosopher, selected_text: selectedText ?? '' }),
    [send],
  );

  const sendTextActivity = useCallback(
    (context: string) => {
      // Cancel previous debounce
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      send({ type: 'text_activity', context });
      // Schedule automatic socratica after silence
      debounceTimer.current = setTimeout(() => {
        if (context.trim().split(/\s+/).filter(Boolean).length >= 12) {
          // Compute trigger excerpt (last significant paragraph)
          const paragraphs = context.split(/\n+/).filter((p) => p.trim().length > 20);
          const lastParagraph = paragraphs[paragraphs.length - 1];
          const excerpt =
            lastParagraph !== undefined
              ? lastParagraph.trim()
              : context.slice(-200).trim();
          triggerSocratica(context, excerpt);
        }
      }, SOCRATICA_DEBOUNCE_MS + 500);
    },
    [send, triggerSocratica],
  );

  const abort = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    send({ type: 'abort' });
    setStreaming(null);
  }, [send]);

  const clearAll = useCallback(() => {
    setInterventions([]);
    setStreaming(null);
  }, []);

  const setReaction = useCallback(
    (id: string, reaction: 'accept' | 'reject' | 'ignore') => {
      setInterventions((prev) =>
        prev.map((iv) => (iv.id === id ? { ...iv, reaction } : iv)),
      );
      // Fire-and-forget REST call (best effort)
      const t = localStorage.getItem('access_token');
      if (t) {
        fetch(`/api/interventions/${id}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body: JSON.stringify({ reaction }),
        }).catch(() => {});
      }
    },
    [],
  );

  return {
    interventions,
    streaming,
    wsStatus,
    triggerSocratica,
    triggerParadosso,
    triggerLente,
    sendTextActivity,
    abort,
    clearAll,
    setReaction,
  };
}
