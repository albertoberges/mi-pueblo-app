import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Stats {
  noticias: number;
  eventos: number;
  incidenciasPendientes: number;
  incidenciasTotal: number;
  usuarios: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ noticias: 0, eventos: 0, incidenciasPendientes: 0, incidenciasTotal: 0, usuarios: 0 });
  const [incidenciasRecientes, setIncidenciasRecientes] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("noticias").select("*", { count: "exact", head: true }).eq("publicado", true),
      supabase.from("eventos").select("*", { count: "exact", head: true }).eq("publicado", true),
      supabase.from("incidencias").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
      supabase.from("incidencias").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("incidencias").select("*, reportado_por_profile:profiles(nombre, apellidos)").order("created_at", { ascending: false }).limit(5),
    ]).then(([n, e, ip, it, u, ir]) => {
      setStats({
        noticias: n.count ?? 0,
        eventos: e.count ?? 0,
        incidenciasPendientes: ip.count ?? 0,
        incidenciasTotal: it.count ?? 0,
        usuarios: u.count ?? 0,
      });
      setIncidenciasRecientes(ir.data ?? []);
    });
  }, []);

  const statCards = [
    { label: "Noticias publicadas", value: stats.noticias, color: "bg-blue-500", icon: "📰" },
    { label: "Eventos activos", value: stats.eventos, color: "bg-purple-500", icon: "📅" },
    { label: "Incidencias pendientes", value: stats.incidenciasPendientes, color: "bg-orange-500", icon: "⚠️" },
    { label: "Ciudadanos registrados", value: stats.usuarios, color: "bg-green-500", icon: "👥" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Control</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-gray-500 text-xs">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Incidencias recientes</h2>
        <div className="space-y-3">
          {incidenciasRecientes.map((inc) => (
            <div key={inc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-800">{inc.titulo}</div>
                <div className="text-xs text-gray-500">
                  {inc.reportado_por_profile?.nombre} · {new Date(inc.created_at).toLocaleDateString("es-ES")}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                inc.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                inc.estado === "en_proceso" ? "bg-blue-100 text-blue-800" :
                "bg-green-100 text-green-800"
              }`}>
                {inc.estado.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
