/** Снимок состояния сущности (REST / WebSocket Home Assistant). */
export interface HassEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}
