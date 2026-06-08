import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useIncidencias } from "@/hooks/useIncidencias";
import { EstadoIncidencia } from "@/lib/types";
import { CategoryColors, Colors } from "@/constants/colors";
import { CategoryLabels } from "@/lib/labels";

const { height } = Dimensions.get("window");

const ESTADO_FILTROS: { label: string; value: EstadoIncidencia | undefined; color: string }[] = [
  { label: "Todas", value: undefined, color: Colors.primary },
  { label: "Pendiente", value: "pendiente", color: CategoryColors.pendiente },
  { label: "En proceso", value: "en_proceso", color: CategoryColors.en_proceso },
  { label: "Resuelta", value: "resuelta", color: CategoryColors.resuelta },
];

// Coordenadas del pueblo (ajusta a tu municipio)
const REGION_INICIAL = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function MapaScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [estadoActivo, setEstadoActivo] = useState<EstadoIncidencia | undefined>(undefined);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const { incidencias } = useIncidencias({ estado: estadoActivo });
  const conCoordenadas = incidencias.filter((i) => i.latitud && i.longitud);

  const incidenciaActiva = seleccionada ? incidencias.find((i) => i.id === seleccionada) : null;

  return (
    <View className="flex-1">
      {/* Mapa */}
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={REGION_INICIAL}
        showsUserLocation
        showsMyLocationButton
      >
        {conCoordenadas.map((inc) => (
          <Marker
            key={inc.id}
            coordinate={{ latitude: inc.latitud!, longitude: inc.longitud! }}
            pinColor={CategoryColors[inc.estado] ?? Colors.danger}
            onPress={() => setSeleccionada(inc.id)}
          >
            <Callout onPress={() => router.push(`/incidencia/${inc.id}`)}>
              <View className="p-2 max-w-48">
                <Text className="font-semibold text-gray-900 text-xs">{inc.titulo}</Text>
                <Text className="text-gray-500 text-xs mt-0.5 capitalize">{inc.categoria} · {inc.estado.replace("_", " ")}</Text>
                <Text className="text-blue-600 text-xs mt-1">Ver detalle →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Filtros flotantes */}
      <View className="absolute top-3 left-0 right-0">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        >
          {ESTADO_FILTROS.map((f) => (
            <TouchableOpacity
              key={f.label}
              className="px-4 py-2 rounded-full shadow-sm flex-row items-center gap-1.5"
              style={{
                backgroundColor: estadoActivo === f.value ? f.color : "#ffffffee",
                elevation: 3,
              }}
              onPress={() => setEstadoActivo(f.value)}
            >
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: estadoActivo === f.value ? "#fff" : f.color }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: estadoActivo === f.value ? "#fff" : "#374151" }}
              >
                {f.label}
              </Text>
              {estadoActivo === f.value && (
                <Text
                  className="text-xs font-bold"
                  style={{ color: "#ffffffcc" }}
                >
                  ({conCoordenadas.length})
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tarjeta de incidencia seleccionada */}
      {incidenciaActiva && (
        <TouchableOpacity
          className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg"
          style={{ elevation: 8 }}
          onPress={() => router.push(`/incidencia/${incidenciaActiva.id}`)}
          activeOpacity={0.9}
        >
          <TouchableOpacity
            className="absolute top-3 right-3"
            onPress={() => setSeleccionada(null)}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <View
            className="self-start px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: CategoryColors[incidenciaActiva.estado] + "22" }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: CategoryColors[incidenciaActiva.estado] }}
            >
              {CategoryLabels.estado[incidenciaActiva.estado]}
            </Text>
          </View>
          <Text className="text-gray-900 font-semibold text-base pr-6">{incidenciaActiva.titulo}</Text>
          {incidenciaActiva.direccion_aproximada && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
              <Text className="text-gray-500 text-xs">{incidenciaActiva.direccion_aproximada}</Text>
            </View>
          )}
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="thumbs-up-outline" size={13} color={Colors.textSecondary} />
              <Text className="text-gray-500 text-xs">{incidenciaActiva.votos} apoyos</Text>
            </View>
            <Text className="text-primary text-xs font-medium">Ver detalle →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Leyenda compacta */}
      {!incidenciaActiva && (
        <View className="absolute bottom-6 right-4 bg-white rounded-xl p-3 shadow-md" style={{ elevation: 4 }}>
          {Object.entries({ pendiente: "Pendiente", en_proceso: "En proceso", resuelta: "Resuelta" }).map(([key, label]) => (
            <View key={key} className="flex-row items-center gap-2 mb-1 last:mb-0">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: CategoryColors[key] }} />
              <Text className="text-gray-600 text-xs">{label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
