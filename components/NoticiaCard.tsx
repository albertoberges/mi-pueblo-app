import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Noticia } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { CategoryLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

interface NoticiaCardProps {
  noticia: Noticia;
  destacada?: boolean;
}

export function NoticiaCard({ noticia, destacada = false }: NoticiaCardProps) {
  const router = useRouter();

  if (destacada) {
    return (
      <TouchableOpacity
        className="mx-4 mb-4 rounded-2xl overflow-hidden bg-white shadow-sm"
        style={{ elevation: 3 }}
        onPress={() => router.push(`/noticia/${noticia.id}`)}
      >
        {noticia.imagen_url && (
          <Image
            source={{ uri: noticia.imagen_url }}
            className="w-full h-48"
            resizeMode="cover"
          />
        )}
        <View className="p-4">
          <Badge label={CategoryLabels.noticia[noticia.categoria]} category={noticia.categoria} size="sm" />
          <Text className="text-lg font-bold text-gray-900 mt-2 leading-tight">{noticia.titulo}</Text>
          <Text className="text-gray-500 mt-1 text-sm" numberOfLines={2}>{noticia.resumen}</Text>
          <Text className="text-gray-400 text-xs mt-2">{formatDate(noticia.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="mx-4 mb-3 rounded-xl overflow-hidden bg-white shadow-sm flex-row"
      style={{ elevation: 2 }}
      onPress={() => router.push(`/noticia/${noticia.id}`)}
    >
      {noticia.imagen_url && (
        <Image
          source={{ uri: noticia.imagen_url }}
          className="w-24 h-24"
          resizeMode="cover"
        />
      )}
      <View className="flex-1 p-3 justify-between">
        <View>
          <Badge label={CategoryLabels.noticia[noticia.categoria]} category={noticia.categoria} size="sm" />
          <Text className="text-sm font-semibold text-gray-900 mt-1 leading-tight" numberOfLines={2}>
            {noticia.titulo}
          </Text>
        </View>
        <Text className="text-gray-400 text-xs">{formatDate(noticia.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}
