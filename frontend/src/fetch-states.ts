import { getApiBase, getToken } from "./api";
import type { HassEntityState } from "./ha-entity";

/** GET /api/states и фильтр по списку (один запрос). */
export async function fetchStatesForEntities(
  entityIds: string[],
): Promise<Map<string, HassEntityState>> {
  const map = new Map<string, HassEntityState>();
  if (entityIds.length === 0) return map;

  const base = getApiBase();
  const token = getToken();
  const url = `${base || ""}/api/states`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    credentials: token ? "omit" : "include",
    headers,
  });
  if (!res.ok) throw new Error(`GET /api/states: ${res.status}`);

  const all = (await res.json()) as HassEntityState[];
  const want = new Set(entityIds);
  for (const s of all) {
    if (want.has(s.entity_id)) map.set(s.entity_id, s);
  }
  return map;
}
