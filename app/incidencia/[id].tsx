import { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Share } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { useIncidencia, votarIncidencia } from "@/hooks/useIncidencias";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabels } from "@/lib/labels";
import { formatDate, timeAgo } from "@/lib/utils";
import { Colors, CategoryColors } from "@/constants/colors";

export default function IncidenciaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incidencia, loading } = useIncidencia(id);
  const { user } = useAuth();
  const [votando, setVotando] = useState(false);

  if (loading || !incidencia) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-gray-400">Cargando...</Text>
      </View>
    );
  }

  const colorEstado = CategoryColors[incidencia.estado] ?? Colors.textSecondary;

  const handleVotar = async () => {
    if (!user) { Alert.alert("Inicia sesión", "Debes estar registrado para apoyar incidencias."); return; }
    setVotando(true);
    try {
      await votarIncidencia(incidencia.id, user.id);
    } catch {
      Alert.alert("Ya has apoyado esta incidencia.");
    } finally {
      setVotando(false);
    }
  };

  const ESTADO_STEPS = ["pendiente", "en_proceso", "resuelta"];
  const stepIndex = ESTADO_STEPS.indexOf(incidencia.estado);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Incidencia",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Share.share({ message: `Incidencia: ${incidencia.titulo}` })}
              className="mr-1"
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-surface">
        {/* Imagen */}
        {incidencia.imagen_url && (
          <Image source={{ uri: incidencia.imagen_url }} className="w-full h-52" resizeMode="cover" />
        )}

        <View className="p-5">
          {/* Badges estado + categoría */}
          <View className="flex-row gap-2 flex-wrap">
            <Badge label={CategoryLabels.incidencia[incidencia.categoria]} category={incidencia.categoria} />
            <Badge label={CategoryLabels.estado[incidencia.estado]} category={incidencia.estado} />
          </View>

          <Text className="text-xl font-bold text-gray-900 mt-3 leading-snug">{incidencia.titulo}</Text>
          <Text className="text-gray-500 text-xs mt-1">{timeAgo(incidencia.created_at)}</Text>
          {incidencia.direccion_aproximada && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text className="text-gray-500 text-xs">{incidencia.direccion_aproximada}</Text>
            </View>
          )}

          {/* Descripción */}
          <Text className="text-gray-700 text-base leading-7 mt-4">{incidencia.descripcion}</Text>

          {/* Progreso de estado */}
          {incidencia.estado !== "rechazada" && incidencia.estado !== "cerrada" && (
            <View className="mt-5 bg-white rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
              <Text className="text-gray-800 font-semibold mb-3">Seguimiento</Text>
              <View className="flex-row items-center">
                {ESTADO_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const current = i === stepIndex;
                  return (
                    <View key={step} className="flex-row items-center flex-1">
                      <View className="items-center flex-1">
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: done ? colorEstado : "#e9ecef" }}
                        >
                          {done ? (
                            <Ionicons name={current ? "time" : "checkmark"} size={16} color="#fff" />
                          ) : (
                            <View className="w-3 h-3 rounded-full bg-gray-300" />
                          )}
                        </View>
                        <Text
                          className="text-xs mt-1 text-center"
                          style={{ color: done ? colorEstado : Colors.textLight, fontWeight: current ? "700" : "400" }}
                        >
                          {CategoryLabels.estado[step as any]}
                        </Text>
                      </View>
                      {i < ESTADO_STEPS.length - 1 && (
                        <View className="h-0.5 flex-1 mx-1 mb-4" style={{ backgroundColor: i < stepIndex ? colorEstado : "#e9ecef" }} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Respuesta del ayuntamiento */}
          {incidencia.respuesta_ayuntamiento && (
            <View className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="business" size={16} color={Colors.primary} />
                <Text className="text-primary font-semibold text-sm">Respuesta del Ayuntamiento</Text>
              </View>
              <Text className="text-gray-700 text-sm leading-6">{incidencia.respuesta_ayuntamiento}</Text>
              {incidencia.fecha_resolucion && (
                <Text className="text-gray-400 text-xs mt-2">{formatDate(incidencia.fecha_resolucion)}</Text>
              )}
            </View>
          )}

          {/* Mapa */}
          {incidencia.latitud && incidencia.longitud && (
            <View className="mt-5">
              <Text className="text-gray-800 font-semibold mb-2">Ubicación</Text>
              <View className="rounded-2xl overflow-hidden h-44 shadow-sm" style={{ elevation: 2 }}>
                <MapView
                  className="flex-1"
                  initialRegion={{
                    latitude: incidencia.latitud,
                    longitude: incidencia.longitud,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                  }}
                  scrollEnabled={false}
                >
                  <Marker
                    coordinate={{ latitude: incidencia.latitud, longitude: incidencia.longitud }}
                    title={incidencia.titulo}
                    pinColor={colorEstado}
                  />
                </MapView>
              </View>
            </View>
          )}

          {/* Botón votar */}
          <TouchableOpacity
            className="mt-6 flex-row items-center justify-center gap-2 border-2 rounded-2xl py-3.5"
            style={{ borderColor: Colors.secondary }}
            onPress={handleVotar}
            disabled={votando}
          >
            <Ionicons name="thumbs-up" size={20} color={Colors.secondary} />
            <Text className="font-bold text-base" style={{ color: Colors.secondary }}>
              Apoyar esta incidencia · {incidencia.votos}
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-xs text-center mt-1">
            Más apoyos = mayor prioridad para el Ayuntamiento
          </Text>
        </View>
        <View className="h-8" />
      </ScrollView>
    </>
  );
}
