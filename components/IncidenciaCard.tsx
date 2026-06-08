import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Incidencia } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { CategoryLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { Colors, CategoryColors } from "@/constants/colors";

interface IncidenciaCardProps {
  incidencia: Incidencia;
}

export function IncidenciaCard({ incidencia }: IncidenciaCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="mx-4 mb-3 rounded-xl overflow-hidden bg-white shadow-sm"
      style={{ elevation: 2 }}
      onPress={() => router.push(`/incidencia/${incidencia.id}`)}
    >
      <View className="flex-row">
        {incidencia.imagen_url && (
          <Image
            source={{ uri: incidencia.imagen_url }}
            className="w-24 h-24"
            resizeMode="cover"
          />
        )}
        <View className="flex-1 p-3">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Badge label={CategoryLabels.incidencia[incidencia.categoria]} category={incidencia.categoria} size="sm" />
            <Badge label={CategoryLabels.estado[incidencia.estado]} category={incidencia.estado} size="sm" />
          </View>
          <Text className="text-sm font-semibold text-gray-900 mt-1" numberOfLines={2}>
            {incidencia.titulo}
          </Text>
          {incidencia.direccion_aproximada && (
            <View className="flex-row items-center mt-1 gap-1">
              <Ionicons name="location-outline" size={11} color={Colors.textSecondary} />
              <Text className="text-gray-500 text-xs" numberOfLines={1}>{incidencia.direccion_aproximada}</Text>
            </View>
          )}
        </View>
      </View>
      <View className="flex-row items-center justify-between px-3 py-2 border-t border-gray-100">
        <Text className="text-gray-400 text-xs">{formatDate(incidencia.created_at)}</Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="thumbs-up-outline" size={13} color={Colors.textSecondary} />
          <Text className="text-gray-500 text-xs">{incidencia.votos} apoyos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
