import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { registerForPushNotifications } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (user) registerForPushNotifications(user.id);

    // Navegar a la ruta del payload cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route as string | undefined;
      if (route) router.push(route as any);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a5276" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
          contentStyle: { backgroundColor: "#f8f9fa" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="noticia/[id]" options={{ title: "Noticia" }} />
        <Stack.Screen name="evento/[id]" options={{ title: "Evento" }} />
        <Stack.Screen name="incidencia/[id]" options={{ title: "Incidencia" }} />
        <Stack.Screen name="incidencia/nueva" options={{ title: "Nueva Incidencia", presentation: "modal" }} />
        <Stack.Screen name="(tabs)/mapa" options={{ title: "Mapa de incidencias", headerShown: true }} />
        <Stack.Screen name="+not-found" options={{ title: "No encontrado" }} />
      </Stack>
    </>
  );
}
