import { getApiBase, getToken } from "./api";
import type { HassEntityState } from "./ha-entity";
import { fetchStatesForEntities } from "./fetch-states";

function getWsUrl(): string {
  const base = getApiBase();
  if (base) {
    const u = new URL(base);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}/api/websocket`;
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/api/websocket`;
}

/** Подписка на `state_changed` + начальный снимок. Без токена — polling REST каждые 15 с. */
export class LiveStatesManager {
  private readonly states = new Map<string, HassEntityState>();
  private ws: WebSocket | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private entityFilter = new Set<string>();

  getState(entityId: string): HassEntityState | undefined {
    return this.states.get(entityId);
  }

  async start(entityIds: string[], onChange: () => void): Promise<void> {
    this.stop();
    this.entityFilter = new Set(entityIds);

    const initial = await fetchStatesForEntities(entityIds);
    for (const [id, st] of initial) this.states.set(id, st);
    onChange();

    const token = getToken();
    if (entityIds.length === 0) return;

    if (token) {
      try {
        await this.runWebSocket(token, onChange);
        return;
      } catch (e) {
        console.warn("WebSocket:", e);
      }
    }
    this.startPolling(entityIds, onChange);
  }

  stop(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.states.clear();
    this.entityFilter.clear();
  }

  private startPolling(entityIds: string[], onChange: () => void): void {
    this.pollTimer = setInterval(() => {
      void fetchStatesForEntities(entityIds)
        .then((m) => {
          for (const [id, st] of m) this.states.set(id, st);
          onChange();
        })
        .catch((e) => console.warn("poll states", e));
    }, 15000);
  }

  private nextId = 1;

  private runWebSocket(token: string, onChange: () => void): Promise<void> {
    const url = getWsUrl();
    const ws = new WebSocket(url);
    this.ws = ws;

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error("Таймаут WebSocket"));
      }, 20000);

      ws.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("Ошибка WebSocket"));
      };

      ws.onmessage = (ev) => {
        let msg: {
          type?: string;
          id?: number;
          success?: boolean;
          event?: {
            event_type?: string;
            data?: {
              entity_id?: string;
              new_state?: HassEntityState | null;
            };
          };
        };
        try {
          msg = JSON.parse(ev.data as string) as typeof msg;
        } catch {
          return;
        }

        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        if (msg.type === "auth_required") {
          ws.send(JSON.stringify({ type: "auth", access_token: token }));
          return;
        }

        if (msg.type === "auth_invalid") {
          window.clearTimeout(timer);
          reject(new Error("Неверный токен"));
          return;
        }

        if (msg.type === "auth_ok") {
          window.clearTimeout(timer);
          const sid = this.nextId++;
          ws.send(
            JSON.stringify({
              id: sid,
              type: "subscribe_events",
              event_type: "state_changed",
            }),
          );
          resolve();
          return;
        }

        if (msg.type === "event" && msg.event?.event_type === "state_changed") {
          const entityId = msg.event.data?.entity_id;
          const newState = msg.event.data?.new_state;
          if (!entityId || !this.entityFilter.has(entityId)) return;
          if (newState && typeof newState === "object" && "entity_id" in newState) {
            this.states.set(entityId, newState as HassEntityState);
          } else if (newState === null) {
            this.states.delete(entityId);
          }
          onChange();
        }
      };
    });
  }
}
