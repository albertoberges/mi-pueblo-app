export type UserRole = "ciudadano" | "admin" | "ayuntamiento";

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  role: UserRole;
  avatar_url?: string;
  push_token?: string;
  created_at: string;
}

export type CategoriaNoticia =
  | "aviso"
  | "noticia"
  | "urgente"
  | "obra"
  | "medioambiente"
  | "cultura"
  | "deporte"
  | "general";

export interface Noticia {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: CategoriaNoticia;
  imagen_url?: string;
  publicado: boolean;
  destacada: boolean;
  fuente?: string;
  fuente_url?: string;
  autor_id: string;
  autor?: Profile;
  created_at: string;
  updated_at: string;
}

export type CategoriaEvento =
  | "fiesta"
  | "cultural"
  | "deportivo"
  | "mercado"
  | "reunion"
  | "formacion"
  | "otro";

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  imagen_url?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  lugar: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  precio?: number;
  aforo?: number;
  organizador: string;
  enlace_inscripcion?: string;
  publicado: boolean;
  created_at: string;
}

export type CategoriaTramite =
  | "padron"
  | "licencias"
  | "impuestos"
  | "urbanismo"
  | "servicios"
  | "subvenciones"
  | "otro";

export interface Tramite {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaTramite;
  requisitos: string[];
  documentos_necesarios: string[];
  plazo_resolucion?: string;
  precio?: number;
  gratuito: boolean;
  online: boolean;
  url_sede_electronica?: string;
  departamento: string;
  telefono_contacto?: string;
  email_contacto?: string;
  horario_atencion?: string;
  activo: boolean;
  created_at: string;
}

export type EstadoIncidencia =
  | "pendiente"
  | "en_proceso"
  | "resuelta"
  | "cerrada"
  | "rechazada";

export type CategoriaIncidencia =
  | "viales"
  | "alumbrado"
  | "parques"
  | "agua"
  | "residuos"
  | "edificios"
  | "trafico"
  | "otro";

export interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  estado: EstadoIncidencia;
  imagen_url?: string;
  latitud?: number;
  longitud?: number;
  direccion_aproximada?: string;
  reportado_por: string;
  reportado_por_profile?: Profile;
  respuesta_ayuntamiento?: string;
  fecha_resolucion?: string;
  votos: number;
  created_at: string;
  updated_at: string;
}

export interface VotoIncidencia {
  incidencia_id: string;
  user_id: string;
  created_at: string;
}
