import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Evento } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { CategoryLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/utils";
import { Colors } from "@/constants/colors";

interface EventoCardProps {
  evento: Evento;
}

export function EventoCard({ evento }: EventoCardProps) {
  const router = useRouter();
  const fecha = new Date(evento.fecha_inicio);

  return (
    <TouchableOpacity
      className="mx-4 mb-3 rounded-xl overflow-hidden bg-white shadow-sm flex-row"
      style={{ elevation: 2 }}
      onPress={() => router.push(`/evento/${evento.id}`)}
    >
      <View
        className="w-16 items-center justify-center py-3 px-2"
        style={{ backgroundColor: Colors.primary }}
      >
        <Text className="text-white text-xs font-medium uppercase">
          {fecha.toLocaleDateString("es-ES", { month: "short" })}
        </Text>
        <Text className="text-white text-2xl font-bold leading-tight">
          {fecha.getDate()}
        </Text>
        <Text className="text-white text-xs opacity-80">
          {fecha.toLocaleDateString("es-ES", { weekday: "short" })}
        </Text>
      </View>
      <View className="flex-1 p-3">
        <Badge label={CategoryLabels.evento[evento.categoria]} category={evento.categoria} size="sm" />
        <Text className="text-sm font-semibold text-gray-900 mt-1" numberOfLines={2}>
          {evento.titulo}
        </Text>
        <View className="flex-row items-center mt-1.5 gap-1">
          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
          <Text className="text-gray-500 text-xs" numberOfLines={1}>{evento.lugar}</Text>
        </View>
        {evento.precio === 0 || evento.precio === null ? (
          <Text className="text-green-600 text-xs mt-1 font-medium">Gratuito</Text>
        ) : (
          <Text className="text-gray-600 text-xs mt-1">{evento.precio}€</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
