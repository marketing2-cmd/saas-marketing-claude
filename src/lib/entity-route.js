import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { itemToRow, rowToItem } from "@/lib/case-map";

// Fábrica de handlers GET/PUT para uma tabela. O front-end mantém o array completo de
// cada entidade em memória (igual ao componente original) e salva o array inteiro de
// forma debounced — aqui isso se traduz em "apagar linhas que saíram da lista" +
// "upsert do que continua/foi adicionado", dentro da mesma rota.
export function createEntityHandlers(table, { numericFields = [], dateFields = [], orderBy = "created_at" } = {}) {
  const emptyToNullFields = [...numericFields, ...dateFields];

  function sanitize(item) {
    const clean = { ...item };
    for (const field of emptyToNullFields) {
      if (clean[field] === "" || clean[field] === undefined) clean[field] = null;
    }
    return clean;
  }

  async function GET() {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: (data || []).map(rowToItem) });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  async function PUT(request) {
    try {
      const body = await request.json();
      const items = Array.isArray(body.items) ? body.items : [];
      const supabase = getSupabaseServerClient();

      const { data: existingRows, error: fetchError } = await supabase.from(table).select("id");
      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

      const incomingIds = new Set(items.map((it) => it.id));
      const idsToDelete = (existingRows || []).map((r) => r.id).filter((id) => !incomingIds.has(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from(table).delete().in("id", idsToDelete);
        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      if (items.length > 0) {
        const rows = items.map((it) => itemToRow(sanitize(it)));
        const { error: upsertError } = await supabase.from(table).upsert(rows, { onConflict: "id" });
        if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return { GET, PUT };
}
