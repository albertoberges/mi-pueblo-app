# Spoti Mando · Amazfit Cheetah (Round) + iPhone

Mini-app de Zepp OS 3 para navegar por **tus listas de Spotify**, elegir canción y controlar la reproducción desde el reloj.

**Cómo funciona:** el reloj no tiene internet. Las peticiones a la API web de Spotify las hace el *Side Service*, que corre dentro de la **app Zepp del iPhone**, y llegan al reloj por Bluetooth. Por eso funciona con iOS: no depende de Android.

```
Reloj (page/*)  ⇄ BLE ⇄  App Zepp en iPhone (app-side/)  ⇄ HTTPS ⇄  API de Spotify  →  Spotify en el iPhone
```

## Limitaciones (léelas antes)

- **Hace falta Spotify Premium.** Las funciones de reproducción de la API solo funcionan con Premium y, desde febrero de 2026, las apps de desarrollo también lo exigen al dueño.
- **Canciones de listas ajenas:** Spotify solo deja ver las canciones de las listas **que has creado tú o en las que colaboras**. Las listas que solo sigues aparecen y puedes **reproducirlas enteras**, pero sin elegir canción.
- **La app Zepp tiene que estar viva en el iPhone.** Si iOS la cierra en segundo plano, el reloj mostrará "Sin conexión con el móvil". Abre Zepp un momento y vuelve a probar.
- **Spotify tiene que estar abierto o haberse usado hace poco en el iPhone**, para que aparezca como dispositivo. Si no, verás el aviso "Abre Spotify en el iPhone…".
- **El volumen remoto en iPhone** a menudo lo bloquea Spotify (`supports_volume: false`). Los botones Vol ± pueden no hacer nada. Para el volumen usa el control de música nativo del reloj.

## Instalación

### 1. Crear tu app en Spotify (5 min)
1. Entra en <https://developer.spotify.com/dashboard> con tu cuenta Premium → **Create app**.
2. **Redirect URI:** `http://127.0.0.1:8888/callback` (exactamente así).
3. API: marca **Web API**. Guarda y copia el **Client ID**. No necesitas el *Client secret*: se usa PKCE.

### 2. Instalar en el reloj (necesita un ordenador)
```bash
npm i -g @zeppos/zeus-cli
cd amazfit-spotify
npm install
zeus login          # cuenta de desarrollador Zepp (gratis): https://console.zepp.com
zeus preview        # elige "Amazfit Cheetah" → muestra un código QR
```
En el iPhone: app **Zepp → Perfil → Ajustes → Acerca de**, pulsa el logo 7 veces para activar el **modo desarrollador**. Después, **Perfil → Tu reloj → Developer mode → Scan** y escanea el QR.

> El `appId` de `app.json` (1099001) es provisional. Si `zeus preview` se queja, crea una app en <https://console.zepp.com> y pon allí su appId.

### 3. Conectar Spotify (una sola vez)
En la app Zepp: **Perfil → Tu reloj → Ajustes de apps → Spoti Mando**.
1. Pega el **Client ID**.
2. Pulsa **Generar enlace**, mantén pulsado el enlace que aparece, cópialo y ábrelo en **Safari**. Acepta los permisos.
3. Safari intentará abrir `127.0.0.1` y fallará. **Es lo esperado.** Copia la URL completa de la barra de direcciones (la que lleva `?code=…`) y pégala en el paso 3 de los ajustes.
4. Abre la app en el reloj. El estado cambia a "✅ Conectado a Spotify".

El código caduca en pocos minutos: haz los pasos 2 y 3 seguidos. El token se renueva solo después.

## Uso en el reloj
- **Inicio:** canción actual, ⏮ / ⏯ / ⏭, aleatorio, volumen y **Mis listas**.
- **Mis listas →** una lista → **Reproducir lista**, o toca una canción para empezar desde ella dentro de esa lista.

## Estructura
| Ruta | Qué es |
|---|---|
| `page/home`, `page/playlists`, `page/tracks` | Pantallas del reloj (diseñadas a 480 px, se escalan a 454 px con `px()`) |
| `app-side/index.js` | Servicio del iPhone: OAuth, renovación de token y llamadas a Spotify |
| `setting/index.js` | Pantalla de ajustes en la app Zepp |
| `shared/spotify-auth.js` | PKCE (SHA-256 y base64url propios) y utilidades. Tests: `npm test` |
