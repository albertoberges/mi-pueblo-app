import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("municipal", {
      name: "Mi Pueblo",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1a5276",
    });
    await Notifications.setNotificationChannelAsync("urgente", {
      name: "Avisos urgentes",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#e74c3c",
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Guardar token en el perfil del usuario
  await supabase.from("profiles").update({ push_token: token }).eq("id", userId);

  return token;
}

export function useNotificationListeners(onReceive?: (n: Notifications.Notification) => void) {
  Notifications.addNotificationReceivedListener((notification) => {
    onReceive?.(notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    // Devuelve la ruta para navegar si viene en el payload
    return data?.route ?? null;
  });
}

// Enviada desde el servidor (Supabase Edge Function o cron)
export async function enviarNotificacionLocal(titulo: string, cuerpo: string, data?: object) {
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: cuerpo, data: data ?? {}, sound: true },
    trigger: null,
  });
}
