import { View, Text, ScrollView, Image, TouchableOpacity, Linking, Share } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useEvento } from "@/hooks/useEventos";
import { Colors, CategoryColors } from "@/constants/colors";
import { CategoryLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/utils";

export default function EventoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { evento, loading } = useEvento(id);

  if (loading || !evento) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-gray-400">Cargando...</Text>
      </View>
    );
  }

  const color = CategoryColors[evento.categoria] ?? Colors.primary;

  const handleShare = () => {
    Share.share({ message: `${evento.titulo}\n${formatEventDate(evento.fecha_inicio, evento.fecha_fin)}\n${evento.lugar}` });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: evento.titulo,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} className="mr-1">
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-surface">
        {/* Imagen o cabecera de color */}
        {evento.imagen_url ? (
          <Image source={{ uri: evento.imagen_url }} className="w-full h-52" resizeMode="cover" />
        ) : (
          <View className="w-full h-28" style={{ backgroundColor: color }} />
        )}

        <View className="p-5">
          {/* Categoría + título */}
          <View
            className="self-start px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: color + "22" }}
          >
            <Text className="text-xs font-semibold" style={{ color }}>
              {CategoryLabels.evento[evento.categoria]}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 leading-tight">{evento.titulo}</Text>

          {/* Info rápida */}
          <View className="mt-4 bg-white rounded-2xl p-4 gap-3 shadow-sm" style={{ elevation: 2 }}>
            <InfoRow icon="calendar" label={formatEventDate(evento.fecha_inicio, evento.fecha_fin)} />
            <InfoRow icon="location" label={evento.lugar} sublabel={evento.direccion} />
            <InfoRow icon="people" label={evento.organizador} />
            {evento.aforo && <InfoRow icon="person" label={`Aforo: ${evento.aforo} personas`} />}
            <InfoRow
              icon="cash"
              label={evento.precio === 0 || evento.precio == null ? "Entrada gratuita" : `${evento.precio} €`}
              color={evento.precio === 0 || evento.precio == null ? Colors.success : undefined}
            />
          </View>

          {/* Descripción */}
          <Text className="text-gray-700 text-base leading-relaxed mt-5">{evento.descripcion}</Text>

          {/* Mapa si tiene coordenadas */}
          {evento.latitud && evento.longitud && (
            <View className="mt-5">
              <Text className="text-gray-800 font-semibold mb-2">Ubicación</Text>
              <View className="rounded-2xl overflow-hidden h-44 shadow-sm" style={{ elevation: 2 }}>
                <MapView
                  className="flex-1"
                  initialRegion={{
                    latitude: evento.latitud,
                    longitude: evento.longitud,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                >
                  <Marker
                    coordinate={{ latitude: evento.latitud, longitude: evento.longitud }}
                    title={evento.titulo}
                    description={evento.lugar}
                    pinColor={color}
                  />
                </MapView>
              </View>
              <TouchableOpacity
                className="mt-2 flex-row items-center gap-1"
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${evento.latitud},${evento.longitud}`
                  )
                }
              >
                <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
                <Text className="text-primary text-sm">Abrir en Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botón inscripción */}
          {evento.enlace_inscripcion && (
            <TouchableOpacity
              className="mt-6 rounded-2xl py-4 items-center"
              style={{ backgroundColor: color }}
              onPress={() => Linking.openURL(evento.enlace_inscripcion!)}
            >
              <Text className="text-white font-bold text-base">Inscribirse al evento</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </>
  );
}

function InfoRow({ icon, label, sublabel, color }: { icon: string; label: string; sublabel?: string; color?: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <Ionicons name={icon as any} size={18} color={color ?? Colors.primary} style={{ marginTop: 1 }} />
      <View className="flex-1">
        <Text className="text-gray-800 text-sm font-medium" style={{ color }}>{label}</Text>
        {sublabel && <Text className="text-gray-500 text-xs mt-0.5">{sublabel}</Text>}
      </View>
    </View>
  );
}
