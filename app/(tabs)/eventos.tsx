import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useEventos } from "@/hooks/useEventos";
import { EventoCard } from "@/components/EventoCard";
import { CategoriaEvento } from "@/lib/types";
import { CategoryLabels } from "@/lib/labels";
import { Colors } from "@/constants/colors";

const categorias: { label: string; value: CategoriaEvento | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Fiestas", value: "fiesta" },
  { label: "Cultural", value: "cultural" },
  { label: "Deporte", value: "deportivo" },
  { label: "Mercado", value: "mercado" },
  { label: "Reuniones", value: "reunion" },
  { label: "Formación", value: "formacion" },
];

export default function EventosScreen() {
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaEvento | undefined>(undefined);
  const { eventos, loading, refreshing, refresh } = useEventos(categoriaActiva);

  return (
    <View className="flex-1 bg-surface">
      {/* Filtros de categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
      >
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            className="mr-2 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: categoriaActiva === cat.value ? Colors.primary : "#f1f3f4",
            }}
            onPress={() => setCategoriaActiva(cat.value)}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: categoriaActiva === cat.value ? "#fff" : Colors.textSecondary }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        <View className="pt-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="mx-4 mb-3 rounded-xl bg-gray-200 h-24" />
            ))
          ) : eventos.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-400 text-base">No hay eventos próximos</Text>
            </View>
          ) : (
            eventos.map((e) => <EventoCard key={e.id} evento={e} />)
          )}
        </View>
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
