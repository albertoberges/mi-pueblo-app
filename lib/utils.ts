export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatEventDate(inicio: string, fin?: string): string {
  const fechaInicio = new Date(inicio);
  const base = fechaInicio.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (!fin) return base;
  const fechaFin = new Date(fin);
  const isSameDay = fechaInicio.toDateString() === fechaFin.toDateString();
  if (isSameDay) {
    return `${base} · ${fechaInicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${fechaFin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${base} → ${fechaFin.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora mismo";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} días`;
  return formatDate(dateStr);
}
