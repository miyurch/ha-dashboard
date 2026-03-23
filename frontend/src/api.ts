import type { LayoutDoc } from "./types";

const LS_BASE = "db_ha_base_url";
const LS_TOKEN = "db_ha_token";

export function getApiBase(): string {
  const fromLs = localStorage.getItem(LS_BASE)?.trim();
  if (fromLs) return fromLs.replace(/\/$/, "");
  return "";
}

export function getToken(): string {
  return localStorage.getItem(LS_TOKEN)?.trim() ?? "";
}

export function setConnection(baseUrl: string, token: string): void {
  localStorage.setItem(LS_BASE, baseUrl.trim().replace(/\/$/, ""));
  localStorage.setItem(LS_TOKEN, token.trim());
}

function layoutUrl(base: string): string {
  const b = base || "";
  return `${b}/api/dashboard_builder/layout`;
}

export async function fetchLayout(): Promise<LayoutDoc> {
  const base = getApiBase();
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(layoutUrl(base), {
    credentials: token ? "omit" : "include",
    headers,
  });
  if (!res.ok) throw new Error(`GET layout: ${res.status}`);
  return (await res.json()) as LayoutDoc;
}

export async function saveLayout(doc: LayoutDoc): Promise<void> {
  const base = getApiBase();
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(layoutUrl(base), {
    method: "POST",
    credentials: token ? "omit" : "include",
    headers,
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error(`POST layout: ${res.status}`);
}
