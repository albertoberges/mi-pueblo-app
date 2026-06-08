import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIAS = ["general", "aviso", "noticia", "urgente", "obra", "medioambiente", "cultura", "deporte"] as const;

export default function Noticias() {
  const [noticias, setNoticias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formulario, setFormulario] = useState<any | null>(null);
  const [guardando, setGuardando] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .order("created_at", { ascending: false });
    setNoticias(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const nuevo = () => setFormulario({
    titulo: "", resumen: "", contenido: "", categoria: "general",
    publicado: false, destacada: false, imagen_url: "", fuente: "", fuente_url: "",
  });

  const guardar = async () => {
    if (!formulario.titulo || !formulario.resumen || !formulario.contenido) return;
    setGuardando(true);
    if (formulario.id) {
      await supabase.from("noticias").update({ ...formulario, updated_at: new Date().toISOString() }).eq("id", formulario.id);
    } else {
      await supabase.from("noticias").insert(formulario);
    }
    setGuardando(false);
    setFormulario(null);
    fetch();
  };

  const togglePublicado = async (id: string, actual: boolean) => {
    await supabase.from("noticias").update({ publicado: !actual }).eq("id", id);
    fetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Noticias y Avisos</h1>
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
          onClick={nuevo}
        >
          + Nueva noticia
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Destacada</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {noticias.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{n.titulo}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{n.categoria}</td>
                  <td className="px-4 py-3">
                    <button
                      className={`px-2 py-1 rounded-full text-xs font-medium ${n.publicado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                      onClick={() => togglePublicado(n.id, n.publicado)}
                    >
                      {n.publicado ? "Publicada" : "Borrador"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${n.destacada ? "text-yellow-600 font-medium" : "text-gray-400"}`}>
                      {n.destacada ? "⭐ Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(n.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs mr-3"
                      onClick={() => setFormulario(n)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulario */}
      {formulario && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {formulario.id ? "Editar noticia" : "Nueva noticia"}
            </h2>

            {[
              { label: "Título *", key: "titulo", type: "text" },
              { label: "Resumen *", key: "resumen", type: "textarea" },
              { label: "Contenido completo *", key: "contenido", type: "textarea-lg" },
              { label: "URL imagen", key: "imagen_url", type: "text" },
              { label: "Fuente", key: "fuente", type: "text" },
              { label: "URL fuente", key: "fuente_url", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} className="mb-3">
                <label className="text-gray-700 font-medium text-sm block mb-1">{label}</label>
                {type === "text" ? (
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formulario[key] ?? ""}
                    onChange={(e) => setFormulario({ ...formulario, [key]: e.target.value })}
                  />
                ) : (
                  <textarea
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none ${type === "textarea-lg" ? "h-32" : "h-16"}`}
                    value={formulario[key] ?? ""}
                    onChange={(e) => setFormulario({ ...formulario, [key]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <div className="mb-3">
              <label className="text-gray-700 font-medium text-sm block mb-1">Categoría</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={formulario.categoria}
                onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
              >
                {CATEGORIAS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formulario.publicado}
                  onChange={(e) => setFormulario({ ...formulario, publicado: e.target.checked })}
                  className="w-4 h-4"
                />
                Publicar
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formulario.destacada}
                  onChange={(e) => setFormulario({ ...formulario, destacada: e.target.checked })}
                  className="w-4 h-4"
                />
                Destacar en portada
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                onClick={() => setFormulario(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
