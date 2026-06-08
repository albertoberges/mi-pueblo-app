import { View, Text, ScrollView, Image, TouchableOpacity, Linking, Share } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNoticia } from "@/hooks/useNoticias";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { Colors } from "@/constants/colors";

export default function NoticiaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { noticia, loading } = useNoticia(id);

  if (loading || !noticia) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-gray-400">Cargando...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Noticia",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Share.share({ message: noticia.titulo, url: noticia.fuente_url ?? "" })}
              className="mr-1"
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-white">
        {noticia.imagen_url && (
          <Image source={{ uri: noticia.imagen_url }} className="w-full h-52" resizeMode="cover" />
        )}

        {/* Franja categoría urgente */}
        {noticia.categoria === "urgente" && (
          <View className="bg-red-600 px-4 py-2 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text className="text-white font-bold text-sm">AVISO URGENTE</Text>
          </View>
        )}

        <View className="p-5">
          <Badge
            label={CategoryLabels.noticia[noticia.categoria]}
            category={noticia.categoria}
          />
          <Text className="text-2xl font-bold text-gray-900 mt-3 leading-snug">{noticia.titulo}</Text>
          <Text className="text-gray-500 text-sm mt-2">{formatDate(noticia.created_at)}</Text>
          {noticia.autor && (
            <Text className="text-gray-500 text-sm">
              Por {noticia.autor.nombre} {noticia.autor.apellidos}
            </Text>
          )}

          <View className="h-px bg-gray-100 my-4" />

          <Text className="text-gray-700 text-base leading-7">{noticia.contenido}</Text>

          {noticia.fuente_url && (
            <TouchableOpacity
              className="mt-5 flex-row items-center gap-1"
              onPress={() => Linking.openURL(noticia.fuente_url!)}
            >
              <Ionicons name="link-outline" size={15} color={Colors.primary} />
              <Text className="text-primary text-sm">
                Fuente: {noticia.fuente ?? noticia.fuente_url}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </>
  );
}
