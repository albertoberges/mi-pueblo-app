import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Noticia, CategoriaNoticia } from "@/lib/types";

export function useNoticias(categoria?: CategoriaNoticia) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      let query = supabase
        .from("noticias")
        .select("*, autor:profiles(id, nombre, apellidos, avatar_url)")
        .eq("publicado", true)
        .order("created_at", { ascending: false });

      if (categoria) query = query.eq("categoria", categoria);

      const { data, error } = await query;
      if (error) throw error;
      setNoticias(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoria]);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = () => { setRefreshing(true); fetch(); };

  return { noticias, loading, error, refreshing, refresh };
}

export function useNoticia(id: string) {
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("noticias")
      .select("*, autor:profiles(id, nombre, apellidos, avatar_url)")
      .eq("id", id)
      .single()
      .then(({ data }) => { setNoticia(data); setLoading(false); });
  }, [id]);

  return { noticia, loading };
}
