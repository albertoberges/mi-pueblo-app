import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Evento, CategoriaEvento } from "@/lib/types";

export function useEventos(categoria?: CategoriaEvento) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      let query = supabase
        .from("eventos")
        .select("*")
        .eq("publicado", true)
        .gte("fecha_inicio", new Date().toISOString())
        .order("fecha_inicio", { ascending: true });

      if (categoria) query = query.eq("categoria", categoria);

      const { data, error } = await query;
      if (error) throw error;
      setEventos(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoria]);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = () => { setRefreshing(true); fetch(); };

  return { eventos, loading, error, refreshing, refresh };
}

export function useEvento(id: string) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("eventos")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => { setEvento(data); setLoading(false); });
  }, [id]);

  return { evento, loading };
}
