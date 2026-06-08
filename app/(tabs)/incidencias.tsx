import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useIncidencias } from "@/hooks/useIncidencias";
import { useAuth } from "@/hooks/useAuth";
import { IncidenciaCard } from "@/components/IncidenciaCard";
import { EstadoIncidencia } from "@/lib/types";
import { Colors } from "@/constants/colors";

const filtrosEstado: { label: string; value: EstadoIncidencia | undefined }[] = [
  { label: "Todas", value: undefined },
  { label: "Pendientes", value: "pendiente" },
  { label: "En proceso", value: "en_proceso" },
  { label: "Resueltas", value: "resuelta" },
];

export default function IncidenciasScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [estadoActivo, setEstadoActivo] = useState<EstadoIncidencia | undefined>(undefined);
  const [soloMias, setSoloMias] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/(tabs)/mapa")} className="mr-3">
          <Ionicons name="map-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const { incidencias, loading, refreshing, refresh } = useIncidencias({
    estado: estadoActivo,
    soloMias,
    userId: user?.id,
  });

  return (
    <View className="flex-1 bg-surface">
      {/* Filtros */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        >
          {filtrosEstado.map((f) => (
            <TouchableOpacity
              key={f.label}
              className="mr-2 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: estadoActivo === f.value ? Colors.primary : "#f1f3f4" }}
              onPress={() => setEstadoActivo(f.value)}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: estadoActivo === f.value ? "#fff" : Colors.textSecondary }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          {user && (
            <TouchableOpacity
              className="mr-2 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: soloMias ? Colors.secondary : "#f1f3f4" }}
              onPress={() => setSoloMias(!soloMias)}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: soloMias ? "#fff" : Colors.textSecondary }}
              >
                Mis incidencias
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        <View className="pt-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <View key={i} className="mx-4 mb-3 rounded-xl bg-gray-200 h-24" />
            ))
          ) : incidencias.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
              <Text className="text-gray-500 mt-3 text-base">¡Sin incidencias!</Text>
              <Text className="text-gray-400 text-sm mt-1">El pueblo está en perfectas condiciones</Text>
            </View>
          ) : (
            incidencias.map((i) => <IncidenciaCard key={i.id} incidencia={i} />)
          )}
        </View>
        <View className="h-20" />
      </ScrollView>

      {/* FAB para nueva incidencia */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: Colors.secondary, elevation: 6 }}
        onPress={() => {
          if (!user) router.push("/auth");
          else router.push("/incidencia/nueva");
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
