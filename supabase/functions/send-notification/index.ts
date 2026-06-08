import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  const { titulo, cuerpo, categoria, route, soloUrgentes } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Obtener tokens de todos los usuarios (o solo admins si soloUrgentes)
  let query = supabase.from("profiles").select("push_token").not("push_token", "is", null);
  const { data: profiles } = await query;

  if (!profiles?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const tokens = profiles.map((p: any) => p.push_token).filter(Boolean);

  // Enviar en lotes de 100 (límite de la API de Expo)
  const batches = [];
  for (let i = 0; i < tokens.length; i += 100) {
    batches.push(tokens.slice(i, i + 100));
  }

  let sent = 0;
  for (const batch of batches) {
    const messages = batch.map((token: string) => ({
      to: token,
      sound: "default",
      title: titulo,
      body: cuerpo,
      data: { route: route ?? "/", categoria },
      channelId: categoria === "urgente" ? "urgente" : "municipal",
      priority: categoria === "urgente" ? "high" : "normal",
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });

    if (res.ok) sent += batch.length;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
