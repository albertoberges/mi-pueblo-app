import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Tramite, CategoriaTramite } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabels } from "@/lib/labels";
import { Colors } from "@/constants/colors";

const categorias: { label: string; icon: string; value: CategoriaTramite | undefined }[] = [
  { label: "Todos", icon: "list", value: undefined },
  { label: "Padrón", icon: "people", value: "padron" },
  { label: "Licencias", icon: "document", value: "licencias" },
  { label: "Impuestos", icon: "cash", value: "impuestos" },
  { label: "Urbanismo", icon: "business", value: "urbanismo" },
  { label: "Servicios", icon: "construct", value: "servicios" },
  { label: "Subvenciones", icon: "gift", value: "subvenciones" },
];

export default function TramitesScreen() {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaTramite | undefined>(undefined);
  const [expandido, setExpandido] = useState<string | null>(null);

  const fetch = async () => {
    let query = supabase.from("tramites").select("*").eq("activo", true).order("nombre");
    if (categoriaActiva) query = query.eq("categoria", categoriaActiva);
    if (busqueda.trim()) query = query.ilike("nombre", `%${busqueda}%`);
    const { data } = await query;
    setTramites(data ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, [categoriaActiva, busqueda]);

  return (
    <View className="flex-1 bg-surface">
      {/* Buscador */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            placeholder="Buscar trámite..."
            value={busqueda}
            onChangeText={setBusqueda}
            className="flex-1 text-sm text-gray-800"
            placeholderTextColor={Colors.textLight}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 max-h-14"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
      >
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            className="mr-2 flex-row items-center px-3 py-1.5 rounded-full gap-1"
            style={{ backgroundColor: categoriaActiva === cat.value ? Colors.primary : "#f1f3f4" }}
            onPress={() => setCategoriaActiva(cat.value)}
          >
            <Ionicons
              name={cat.icon as any}
              size={13}
              color={categoriaActiva === cat.value ? "#fff" : Colors.textSecondary}
            />
            <Text
              className="text-xs font-medium"
              style={{ color: categoriaActiva === cat.value ? "#fff" : Colors.textSecondary }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />}
      >
        <View className="pt-4 pb-6">
          {tramites.length === 0 && !loading ? (
            <View className="items-center py-16">
              <Text className="text-gray-400">No se encontraron trámites</Text>
            </View>
          ) : (
            tramites.map((tramite) => (
              <TouchableOpacity
                key={tramite.id}
                className="mx-4 mb-3 bg-white rounded-xl overflow-hidden shadow-sm"
                style={{ elevation: 2 }}
                onPress={() => setExpandido(expandido === tramite.id ? null : tramite.id)}
              >
                <View className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-semibold text-gray-900">{tramite.nombre}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">{tramite.departamento}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {tramite.online && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-green-700 text-xs font-medium">Online</Text>
                        </View>
                      )}
                      {tramite.gratuito ? (
                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                          <Text className="text-blue-700 text-xs font-medium">Gratuito</Text>
                        </View>
                      ) : tramite.precio ? (
                        <Text className="text-gray-600 text-xs">{tramite.precio}€</Text>
                      ) : null}
                      <Ionicons
                        name={expandido === tramite.id ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={Colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>

                {expandido === tramite.id && (
                  <View className="px-4 pb-4 border-t border-gray-100">
                    <Text className="text-gray-600 text-sm mt-3">{tramite.descripcion}</Text>

                    {tramite.requisitos?.length > 0 && (
                      <View className="mt-3">
                        <Text className="text-gray-800 font-semibold text-xs mb-1">Requisitos:</Text>
                        {tramite.requisitos.map((r, i) => (
                          <Text key={i} className="text-gray-600 text-xs">• {r}</Text>
                        ))}
                      </View>
                    )}

                    {tramite.documentos_necesarios?.length > 0 && (
                      <View className="mt-2">
                        <Text className="text-gray-800 font-semibold text-xs mb-1">Documentación:</Text>
                        {tramite.documentos_necesarios.map((d, i) => (
                          <Text key={i} className="text-gray-600 text-xs">• {d}</Text>
                        ))}
                      </View>
                    )}

                    <View className="mt-3 gap-1">
                      {tramite.plazo_resolucion && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                          <Text className="text-gray-500 text-xs">{tramite.plazo_resolucion}</Text>
                        </View>
                      )}
                      {tramite.horario_atencion && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                          <Text className="text-gray-500 text-xs">{tramite.horario_atencion}</Text>
                        </View>
                      )}
                      {tramite.telefono_contacto && (
                        <TouchableOpacity
                          className="flex-row items-center gap-1"
                          onPress={() => Linking.openURL(`tel:${tramite.telefono_contacto}`)}
                        >
                          <Ionicons name="call-outline" size={13} color={Colors.primary} />
                          <Text className="text-primary text-xs">{tramite.telefono_contacto}</Text>
                        </TouchableOpacity>
                      )}
                      {tramite.url_sede_electronica && (
                        <TouchableOpacity
                          className="mt-2 bg-primary rounded-lg py-2 px-4 items-center"
                          onPress={() => Linking.openURL(tramite.url_sede_electronica!)}
                        >
                          <Text className="text-white text-sm font-medium">Tramitar online</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
