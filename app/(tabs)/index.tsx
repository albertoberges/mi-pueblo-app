import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNoticias } from "@/hooks/useNoticias";
import { NoticiaCard } from "@/components/NoticiaCard";
import { Colors } from "@/constants/colors";

const QuickActions = [
  { label: "Eventos", icon: "calendar", route: "/(tabs)/eventos", color: "#8e44ad" },
  { label: "Trámites", icon: "document-text", route: "/(tabs)/tramites", color: "#1a5276" },
  { label: "Incidencias", icon: "warning", route: "/(tabs)/incidencias", color: "#e67e22" },
  { label: "Nueva incidencia", icon: "add-circle", route: "/incidencia/nueva", color: "#e74c3c" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { noticias, loading, refreshing, refresh } = useNoticias();

  const destacadas = noticias.filter((n) => n.destacada).slice(0, 2);
  const resto = noticias.filter((n) => !n.destacada).slice(0, 10);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
    >
      {/* Accesos rápidos */}
      <View className="bg-primary px-4 pt-2 pb-6">
        <View className="flex-row justify-between">
          {QuickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              className="items-center flex-1"
              onPress={() => router.push(action.route as any)}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mb-1"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <Ionicons name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text className="text-white text-xs font-medium text-center">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mt-4">
        {/* Urgentes */}
        {noticias.filter((n) => n.categoria === "urgente").length > 0 && (
          <View className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text className="text-red-700 font-medium flex-1" numberOfLines={2}>
              {noticias.find((n) => n.categoria === "urgente")?.titulo}
            </Text>
          </View>
        )}

        {/* Noticias destacadas */}
        {destacadas.length > 0 && (
          <>
            <Text className="text-gray-800 font-bold text-base px-4 mb-3">Destacado</Text>
            {destacadas.map((n) => (
              <NoticiaCard key={n.id} noticia={n} destacada />
            ))}
          </>
        )}

        {/* Últimas noticias */}
        <View className="flex-row items-center justify-between px-4 mb-3 mt-2">
          <Text className="text-gray-800 font-bold text-base">Últimas noticias</Text>
          <TouchableOpacity>
            <Text className="text-primary text-sm">Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <View key={i} className="mx-4 mb-3 rounded-xl bg-gray-200 h-24 animate-pulse" />
            ))
          : resto.map((n) => <NoticiaCard key={n.id} noticia={n} />)}
      </View>

      <View className="h-6" />
    </ScrollView>
  );
}
