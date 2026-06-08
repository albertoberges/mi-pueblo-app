import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/colors";

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100"
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={20} color={danger ? Colors.danger : Colors.textSecondary} />
      <Text
        className="flex-1 ml-3 text-base"
        style={{ color: danger ? Colors.danger : Colors.textPrimary }}
      >
        {label}
      </Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />}
    </TouchableOpacity>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Ionicons name="person-circle-outline" size={80} color={Colors.textLight} />
        <Text className="text-xl font-bold text-gray-800 mt-4">Accede a tu cuenta</Text>
        <Text className="text-gray-500 text-center mt-2 mb-6">
          Inicia sesión para reportar incidencias, recibir notificaciones personalizadas y más.
        </Text>
        <TouchableOpacity
          className="w-full bg-primary rounded-xl py-3 items-center"
          onPress={() => router.push("/auth")}
        >
          <Text className="text-white font-semibold text-base">Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      {/* Avatar y datos */}
      <View className="bg-primary px-6 pt-6 pb-8 items-center">
        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-white text-3xl font-bold">
            {profile.nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-white text-lg font-bold">{profile.nombre} {profile.apellidos}</Text>
        <Text className="text-white/70 text-sm mt-0.5">{profile.email}</Text>
        {profile.role !== "ciudadano" && (
          <View className="mt-2 bg-secondary px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium capitalize">{profile.role}</Text>
          </View>
        )}
      </View>

      {/* Menú */}
      <View className="mt-4 rounded-xl overflow-hidden mx-4 shadow-sm" style={{ elevation: 2 }}>
        <MenuItem
          icon="person-outline"
          label="Editar perfil"
          onPress={() => {}}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notificaciones"
          onPress={() => {}}
        />
        <MenuItem
          icon="warning-outline"
          label="Mis incidencias"
          onPress={() => router.push("/(tabs)/incidencias")}
        />
      </View>

      <View className="mt-4 rounded-xl overflow-hidden mx-4 shadow-sm" style={{ elevation: 2 }}>
        <MenuItem
          icon="information-circle-outline"
          label="Sobre la app"
          onPress={() => {}}
        />
        <MenuItem
          icon="mail-outline"
          label="Contactar con el Ayuntamiento"
          onPress={() => {}}
        />
      </View>

      <View className="mt-4 rounded-xl overflow-hidden mx-4 shadow-sm mb-8" style={{ elevation: 2 }}>
        <MenuItem
          icon="log-out-outline"
          label="Cerrar sesión"
          onPress={handleSignOut}
          danger
        />
      </View>
    </ScrollView>
  );
}
