import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/colors";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Rellena todos los campos.");
      return;
    }
    setLoading(true);
    try {
      if (modo === "login") {
        await signIn(email, password);
      } else {
        if (!nombre.trim() || !apellidos.trim()) {
          Alert.alert("Error", "El nombre y apellidos son obligatorios.");
          setLoading(false);
          return;
        }
        await signUp(email, password, nombre, apellidos);
        Alert.alert("¡Registro completado!", "Verifica tu email para activar la cuenta.");
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Ha ocurrido un error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary px-6 pt-16 pb-12 items-center">
          <Text className="text-white text-3xl font-bold">Mi Pueblo</Text>
          <Text className="text-white/70 text-sm mt-1">Conecta con tu comunidad</Text>
        </View>

        <View className="px-6 pt-8">
          {/* Selector login/registro */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "registro"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                className="flex-1 py-2.5 rounded-lg items-center"
                style={{ backgroundColor: modo === m ? "#fff" : "transparent" }}
                onPress={() => setModo(m)}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: modo === m ? Colors.primary : Colors.textSecondary }}
                >
                  {m === "login" ? "Iniciar sesión" : "Registrarse"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {modo === "registro" && (
            <>
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1.5">Nombre</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1.5">Apellidos</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                  placeholder="Tus apellidos"
                  value={apellidos}
                  onChangeText={setApellidos}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1.5">Email</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-1.5">Contraseña</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            style={{ opacity: loading ? 0.7 : 1 }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "..." : modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 py-3 items-center" onPress={() => router.back()}>
            <Text className="text-gray-500 text-sm">Continuar sin cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
