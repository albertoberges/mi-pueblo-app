import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Incidencia, CategoriaIncidencia, EstadoIncidencia } from "@/lib/types";

export function useIncidencias(filtros?: {
  categoria?: CategoriaIncidencia;
  estado?: EstadoIncidencia;
  soloMias?: boolean;
  userId?: string;
}) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      let query = supabase
        .from("incidencias")
        .select("*, reportado_por_profile:profiles(id, nombre, apellidos)")
        .order("created_at", { ascending: false });

      if (filtros?.categoria) query = query.eq("categoria", filtros.categoria);
      if (filtros?.estado) query = query.eq("estado", filtros.estado);
      if (filtros?.soloMias && filtros.userId) {
        query = query.eq("reportado_por", filtros.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setIncidencias(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtros?.categoria, filtros?.estado, filtros?.soloMias, filtros?.userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = () => { setRefreshing(true); fetch(); };

  return { incidencias, loading, error, refreshing, refresh };
}

export function useIncidencia(id: string) {
  const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("incidencias")
      .select("*, reportado_por_profile:profiles(id, nombre, apellidos)")
      .eq("id", id)
      .single()
      .then(({ data }) => { setIncidencia(data); setLoading(false); });
  }, [id]);

  return { incidencia, loading };
}

export async function crearIncidencia(payload: {
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  imagen_url?: string;
  latitud?: number;
  longitud?: number;
  direccion_aproximada?: string;
  reportado_por: string;
}) {
  const { data, error } = await supabase
    .from("incidencias")
    .insert({ ...payload, estado: "pendiente", votos: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function votarIncidencia(incidenciaId: string, userId: string) {
  const { error } = await supabase
    .from("votos_incidencias")
    .insert({ incidencia_id: incidenciaId, user_id: userId });
  if (error) throw error;
}
