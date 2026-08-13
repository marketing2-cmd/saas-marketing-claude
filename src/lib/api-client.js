import { useEffect, useRef } from "react";

const ENTITY_ENDPOINTS = {
  projects: "/api/projects",
  campaigns: "/api/campaigns",
  demands: "/api/demands",
  suppliers: "/api/suppliers",
  events: "/api/events",
  team: "/api/team",
};

// Equivalente a loadShared(key, fallback) do artifact original, mas lendo de uma
// rota /api/* (Postgres via Supabase) em vez de window.storage. Retorna null em caso
// de erro de rede, para que o chamador decida usar dados seed como fallback offline —
// exatamente como o catch{} do loadShared original.
export async function loadEntity(entity) {
  try {
    const res = await fetch(ENTITY_ENDPOINTS[entity]);
    if (!res.ok) throw new Error(`Falha ao carregar ${entity}`);
    const { items } = await res.json();
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error("Erro ao carregar", entity, e);
    return null;
  }
}

// Equivalente a saveShared(key, value): persiste a lista inteira da entidade.
export async function saveEntity(entity, items) {
  try {
    await fetch(ENTITY_ENDPOINTS[entity], {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch (e) {
    console.error("Erro ao salvar", entity, e);
  }
}

// Mesmo comportamento do useAutoSave original: debounce de 300ms após qualquer mudança.
export function useAutoSave(entity, value, loaded) {
  const timer = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveEntity(entity, value);
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loaded]);
}

// Substitui a chamada direta a api.anthropic.com feita no artifact original (que só
// funcionava dentro do sandbox do Claude.ai). Agora passa por uma rota do servidor que
// guarda a ANTHROPIC_API_KEY.
export async function suggestDemandWithAI(demand, teamNames) {
  const res = await fetch("/api/ai/suggest-demand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demand, teamNames }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Falha ao obter sugestão da IA.");
  return data;
}
