import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ESTADOS = ["pendiente", "en_proceso", "resuelta", "cerrada", "rechazada"] as const;
type Estado = typeof ESTADOS[number];

const ESTADO_COLORS: Record<Estado, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  en_proceso: "bg-blue-100 text-blue-800",
  resuelta: "bg-green-100 text-green-800",
  cerrada: "bg-gray-100 text-gray-800",
  rechazada: "bg-red-100 text-red-800",
};

const ESTADO_LABELS: Record<Estado, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
  rechazada: "Rechazada",
};

export default function Incidencias() {
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<Estado | "todas">("todas");
  const [seleccionada, setSeleccionada] = useState<any | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<Estado>("pendiente");
  const [guardando, setGuardando] = useState(false);

  const fetch = async () => {
    let query = supabase
      .from("incidencias")
      .select("*, reportado_por_profile:profiles(nombre, apellidos, email)")
      .order("created_at", { ascending: false });
    if (filtroEstado !== "todas") query = query.eq("estado", filtroEstado);
    const { data } = await query;
    setIncidencias(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [filtroEstado]);

  const handleGuardar = async () => {
    if (!seleccionada) return;
    setGuardando(true);
    await supabase
      .from("incidencias")
      .update({
        estado: nuevoEstado,
        respuesta_ayuntamiento: respuesta,
        fecha_resolucion: ["resuelta", "cerrada"].includes(nuevoEstado) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", seleccionada.id);
    setGuardando(false);
    setSeleccionada(null);
    fetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incidencias ciudadanas</h1>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as any)}
        >
          <option value="todas">Todas</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Incidencia</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Ciudadano</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incidencias.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{inc.titulo}</div>
                    <div className="text-gray-500 text-xs truncate max-w-xs">{inc.descripcion}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{inc.categoria}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {inc.reportado_por_profile?.nombre} {inc.reportado_por_profile?.apellidos}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[inc.estado as Estado]}`}>
                      {ESTADO_LABELS[inc.estado as Estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(inc.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      onClick={() => { setSeleccionada(inc); setNuevoEstado(inc.estado); setRespuesta(inc.respuesta_ayuntamiento ?? ""); }}
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de gestión */}
      {seleccionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{seleccionada.titulo}</h2>
            <p className="text-gray-600 text-sm mb-4">{seleccionada.descripcion}</p>

            <div className="mb-4">
              <label className="text-gray-700 font-medium text-sm block mb-1">Cambiar estado</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value as Estado)}
              >
                {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium text-sm block mb-1">
                Respuesta al ciudadano (visible en la app)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"
                placeholder="Escribe aquí la respuesta o información sobre el seguimiento..."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                onClick={() => setSeleccionada(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
