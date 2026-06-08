-- Trigger para enviar notificación push al publicar una noticia
CREATE OR REPLACE FUNCTION notify_on_noticia_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Solo si acaba de ponerse publicado = true
  IF NEW.publicado = TRUE AND (OLD.publicado IS NULL OR OLD.publicado = FALSE) THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'titulo', NEW.titulo,
        'cuerpo', NEW.resumen,
        'categoria', NEW.categoria,
        'route', '/noticia/' || NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_noticia_published
  AFTER INSERT OR UPDATE ON noticias
  FOR EACH ROW EXECUTE FUNCTION notify_on_noticia_published();

-- Trigger para notificar al ciudadano cuando su incidencia cambia de estado
CREATE OR REPLACE FUNCTION notify_incidencia_estado()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
  v_nombre TEXT;
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    SELECT push_token, nombre INTO v_token, v_nombre
    FROM profiles WHERE id = NEW.reportado_por;

    IF v_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object(
          'titulo', 'Tu incidencia ha sido actualizada',
          'cuerpo', '"' || NEW.titulo || '" está ahora en estado: ' || REPLACE(NEW.estado, '_', ' '),
          'categoria', 'aviso',
          'route', '/incidencia/' || NEW.id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_incidencia_estado_change
  AFTER UPDATE ON incidencias
  FOR EACH ROW EXECUTE FUNCTION notify_incidencia_estado();
