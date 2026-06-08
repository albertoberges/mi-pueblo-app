-- ============================================================
-- ESQUEMA INICIAL - App Municipal
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- PROFILES (amplía auth.users)
-- ============================================================
CREATE TYPE user_role AS ENUM ('ciudadano', 'admin', 'ayuntamiento');

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  apellidos   TEXT NOT NULL,
  telefono    TEXT,
  role        user_role NOT NULL DEFAULT 'ciudadano',
  avatar_url  TEXT,
  push_token  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_own"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: crea perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, nombre, apellidos)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', '')
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- NOTICIAS
-- ============================================================
CREATE TYPE categoria_noticia AS ENUM (
  'aviso', 'noticia', 'urgente', 'obra', 'medioambiente', 'cultura', 'deporte', 'general'
);

CREATE TABLE noticias (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo       TEXT NOT NULL,
  resumen      TEXT NOT NULL,
  contenido    TEXT NOT NULL,
  categoria    categoria_noticia NOT NULL DEFAULT 'general',
  imagen_url   TEXT,
  publicado    BOOLEAN NOT NULL DEFAULT FALSE,
  destacada    BOOLEAN NOT NULL DEFAULT FALSE,
  fuente       TEXT,
  fuente_url   TEXT,
  autor_id     UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "noticias_read_published" ON noticias FOR SELECT USING (publicado = TRUE);
CREATE POLICY "noticias_admin_all" ON noticias FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ayuntamiento')));

CREATE INDEX idx_noticias_categoria ON noticias(categoria);
CREATE INDEX idx_noticias_publicado ON noticias(publicado, created_at DESC);

-- ============================================================
-- EVENTOS
-- ============================================================
CREATE TYPE categoria_evento AS ENUM (
  'fiesta', 'cultural', 'deportivo', 'mercado', 'reunion', 'formacion', 'otro'
);

CREATE TABLE eventos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo              TEXT NOT NULL,
  descripcion         TEXT NOT NULL,
  categoria           categoria_evento NOT NULL DEFAULT 'otro',
  imagen_url          TEXT,
  fecha_inicio        TIMESTAMPTZ NOT NULL,
  fecha_fin           TIMESTAMPTZ,
  lugar               TEXT NOT NULL,
  direccion           TEXT,
  latitud             DOUBLE PRECISION,
  longitud            DOUBLE PRECISION,
  precio              DECIMAL(8,2),
  aforo               INTEGER,
  organizador         TEXT NOT NULL DEFAULT 'Ayuntamiento',
  enlace_inscripcion  TEXT,
  publicado           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_read_published" ON eventos FOR SELECT USING (publicado = TRUE);
CREATE POLICY "eventos_admin_all" ON eventos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ayuntamiento')));

CREATE INDEX idx_eventos_fecha ON eventos(fecha_inicio ASC) WHERE publicado = TRUE;

-- ============================================================
-- TRÁMITES
-- ============================================================
CREATE TYPE categoria_tramite AS ENUM (
  'padron', 'licencias', 'impuestos', 'urbanismo', 'servicios', 'subvenciones', 'otro'
);

CREATE TABLE tramites (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre                TEXT NOT NULL,
  descripcion           TEXT NOT NULL,
  categoria             categoria_tramite NOT NULL DEFAULT 'otro',
  requisitos            TEXT[] NOT NULL DEFAULT '{}',
  documentos_necesarios TEXT[] NOT NULL DEFAULT '{}',
  plazo_resolucion      TEXT,
  precio                DECIMAL(8,2),
  gratuito              BOOLEAN NOT NULL DEFAULT TRUE,
  online                BOOLEAN NOT NULL DEFAULT FALSE,
  url_sede_electronica  TEXT,
  departamento          TEXT NOT NULL,
  telefono_contacto     TEXT,
  email_contacto        TEXT,
  horario_atencion      TEXT,
  activo                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tramites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tramites_read_all"  ON tramites FOR SELECT USING (activo = TRUE);
CREATE POLICY "tramites_admin_all" ON tramites FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ayuntamiento')));

-- ============================================================
-- INCIDENCIAS
-- ============================================================
CREATE TYPE categoria_incidencia AS ENUM (
  'viales', 'alumbrado', 'parques', 'agua', 'residuos', 'edificios', 'trafico', 'otro'
);
CREATE TYPE estado_incidencia AS ENUM (
  'pendiente', 'en_proceso', 'resuelta', 'cerrada', 'rechazada'
);

CREATE TABLE incidencias (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo                 TEXT NOT NULL,
  descripcion            TEXT NOT NULL,
  categoria              categoria_incidencia NOT NULL DEFAULT 'otro',
  estado                 estado_incidencia NOT NULL DEFAULT 'pendiente',
  imagen_url             TEXT,
  latitud                DOUBLE PRECISION,
  longitud               DOUBLE PRECISION,
  direccion_aproximada   TEXT,
  reportado_por          UUID NOT NULL REFERENCES profiles(id),
  respuesta_ayuntamiento TEXT,
  fecha_resolucion       TIMESTAMPTZ,
  votos                  INTEGER NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidencias_read_all"   ON incidencias FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "incidencias_read_anon"  ON incidencias FOR SELECT TO anon USING (TRUE);
CREATE POLICY "incidencias_insert_own" ON incidencias FOR INSERT
  WITH CHECK (auth.uid() = reportado_por);
CREATE POLICY "incidencias_admin_all"  ON incidencias FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ayuntamiento')));

CREATE TABLE votos_incidencias (
  incidencia_id UUID NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (incidencia_id, user_id)
);

ALTER TABLE votos_incidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votos_read_all"    ON votos_incidencias FOR SELECT USING (TRUE);
CREATE POLICY "votos_insert_own"  ON votos_incidencias FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: actualiza contador de votos
CREATE OR REPLACE FUNCTION actualizar_votos()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE incidencias SET votos = votos + 1 WHERE id = NEW.incidencia_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE incidencias SET votos = votos - 1 WHERE id = OLD.incidencia_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_voto_change
  AFTER INSERT OR DELETE ON votos_incidencias
  FOR EACH ROW EXECUTE FUNCTION actualizar_votos();

CREATE INDEX idx_incidencias_estado    ON incidencias(estado);
CREATE INDEX idx_incidencias_categoria ON incidencias(categoria);
CREATE INDEX idx_incidencias_reporter  ON incidencias(reportado_por);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'public');
CREATE POLICY "storage_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public');

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================
INSERT INTO tramites (nombre, descripcion, categoria, requisitos, documentos_necesarios, gratuito, departamento, horario_atencion) VALUES
('Empadronamiento', 'Trámite para inscribirse en el padrón municipal de habitantes.', 'padron',
  ARRAY['Ser residente en el municipio', 'Tener domicilio habitual en el municipio'],
  ARRAY['DNI/NIE/Pasaporte en vigor', 'Documento acreditativo del domicilio (contrato de alquiler, escritura, etc.)'],
  TRUE, 'Secretaría', 'Lunes a Viernes de 9:00 a 14:00h'),
('Licencia de obras menores', 'Para pequeñas reformas en viviendas (pintura, alicatado, fontanería, etc.).', 'licencias',
  ARRAY['Propietario o autorización del propietario'],
  ARRAY['DNI del solicitante', 'Descripción de las obras', 'Presupuesto del contratista'],
  FALSE, 'Urbanismo', 'Lunes a Viernes de 9:00 a 13:30h'),
('Alta en el servicio de agua', 'Solicitud de alta en el servicio municipal de abastecimiento de agua.', 'servicios',
  ARRAY['Ser propietario o inquilino del inmueble'],
  ARRAY['DNI', 'Contrato de alquiler o escritura', 'Nº de referencia catastral'],
  FALSE, 'Servicios Municipales', 'Lunes a Viernes de 9:00 a 14:00h');
