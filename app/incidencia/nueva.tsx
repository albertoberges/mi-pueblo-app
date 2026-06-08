import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { crearIncidencia } from "@/hooks/useIncidencias";
import { CategoriaIncidencia } from "@/lib/types";
import { CategoryLabels } from "@/lib/labels";
import { Colors } from "@/constants/colors";

const categorias: CategoriaIncidencia[] = [
  "viales", "alumbrado", "parques", "agua", "residuos", "edificios", "trafico", "otro",
];

const categoriaIcons: Record<CategoriaIncidencia, string> = {
  viales: "car",
  alumbrado: "bulb",
  parques: "leaf",
  agua: "water",
  residuos: "trash",
  edificios: "business",
  trafico: "alert-circle",
  otro: "ellipsis-horizontal",
};

export default function NuevaIncidenciaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaIncidencia | null>(null);
  const [imagen, setImagen] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [direccion, setDireccion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localizando, setLocalizando] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const getLocation = async () => {
    setLocalizando(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Activa la ubicación para añadirla automáticamente.");
      setLocalizando(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    const [addr] = await Location.reverseGeocodeAsync(loc.coords);
    if (addr) {
      setDireccion(`${addr.street ?? ""} ${addr.streetNumber ?? ""}, ${addr.city ?? ""}`.trim());
    }
    setLocalizando(false);
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split(".").pop() ?? "jpg";
      const fileName = `incidencias/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("public").upload(fileName, blob);
      if (error) throw error;
      const { data } = supabase.storage.from("public").getPublicUrl(fileName);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !descripcion.trim() || !categoria) {
      Alert.alert("Campos requeridos", "Rellena el título, descripción y categoría.");
      return;
    }
    setSubmitting(true);
    try {
      let imagenUrl: string | undefined;
      if (imagen) imagenUrl = await uploadImage(imagen) ?? undefined;
      await crearIncidencia({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        imagen_url: imagenUrl,
        latitud: coords?.lat,
        longitud: coords?.lng,
        direccion_aproximada: direccion || undefined,
        reportado_por: user!.id,
      });
      Alert.alert("¡Incidencia enviada!", "El Ayuntamiento la revisará en breve.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo enviar la incidencia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" keyboardShouldPersistTaps="handled">
      <View className="p-4 gap-4">
        {/* Título */}
        <View>
          <Text className="text-gray-700 font-semibold mb-1">Título *</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="Ej: Farola apagada en la Calle Mayor"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100}
          />
        </View>

        {/* Categoría */}
        <View>
          <Text className="text-gray-700 font-semibold mb-2">Categoría *</Text>
          <View className="flex-row flex-wrap gap-2">
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat}
                className="flex-row items-center px-3 py-2 rounded-xl border gap-1"
                style={{
                  backgroundColor: categoria === cat ? Colors.primary : "#fff",
                  borderColor: categoria === cat ? Colors.primary : "#dee2e6",
                }}
                onPress={() => setCategoria(cat)}
              >
                <Ionicons
                  name={categoriaIcons[cat] as any}
                  size={14}
                  color={categoria === cat ? "#fff" : Colors.textSecondary}
                />
                <Text
                  className="text-xs font-medium"
                  style={{ color: categoria === cat ? "#fff" : Colors.textSecondary }}
                >
                  {CategoryLabels.incidencia[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View>
          <Text className="text-gray-700 font-semibold mb-1">Descripción *</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="Describe el problema con el mayor detalle posible..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{descripcion.length}/500</Text>
        </View>

        {/* Foto */}
        <View>
          <Text className="text-gray-700 font-semibold mb-2">Foto (opcional)</Text>
          {imagen ? (
            <View className="relative">
              <Image source={{ uri: imagen }} className="w-full h-48 rounded-xl" resizeMode="cover" />
              <TouchableOpacity
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
                onPress={() => setImagen(null)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-white border border-gray-200 rounded-xl py-4 items-center gap-1"
                onPress={takePhoto}
              >
                <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                <Text className="text-primary text-xs font-medium">Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-white border border-gray-200 rounded-xl py-4 items-center gap-1"
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color={Colors.primary} />
                <Text className="text-primary text-xs font-medium">Galería</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ubicación */}
        <View>
          <Text className="text-gray-700 font-semibold mb-2">Ubicación (opcional)</Text>
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center gap-2"
            onPress={getLocation}
            disabled={localizando}
          >
            {localizando ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name={coords ? "location" : "location-outline"}
                size={20}
                color={coords ? Colors.success : Colors.primary}
              />
            )}
            <Text className="text-gray-700 flex-1 text-sm">
              {coords ? (direccion || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`) : "Obtener mi ubicación actual"}
            </Text>
            {coords && (
              <TouchableOpacity onPress={() => { setCoords(null); setDireccion(""); }}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Enviar */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mt-2"
          style={{ opacity: submitting ? 0.7 : 1 }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Enviar incidencia</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
