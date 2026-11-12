# Pistas Pirineo · App Zepp OS para Amazfit Cheetah Round

Mapa de pistas de esquí en el reloj, con:

- Mapa centrado en tu posición GPS. Las pistas se pintan con su color (verde, azul, roja o negra) y los remontes en gris claro.
- Nombre, número y dificultad de la pista en la que estás.
- Aviso de **FUERA DE PISTA**: el anillo del borde se pone rojo, el reloj vibra y se muestra a cuántos metros está la pista más cercana.
- Detección de remonte: en un telesilla no salta el aviso de fuera de pista.
- Zoom con los botones `+` / `-` de la pantalla o con los botones físicos de arriba y abajo.

Estaciones incluidas: **Formigal, Panticosa, Astún, Candanchú y Cerler**. Si quieres añadir más, edita `ZONES` en `scripts/fetch-pistes.mjs`.

## 1. Descargar las pistas (obligatorio)

Los trazados se descargan de OpenStreetMap; el repositorio no los incluye. Necesitas Node 18 o superior:

```bash
cd amazfit-pistas-pirineo
npm install
npm run datos      # genera data/pistes.js
npm test
```

Ejecuta `npm run datos` de nuevo antes de cada temporada para tener los datos al día.

## 2. Instalar en el reloj

1. Instala la herramienta de Zepp: `npm i -g @zeppos/zeus-cli`
2. Activa el modo desarrollador en la app Zepp del móvil: *Perfil → Ajustes → Acerca de*, pulsa el logo 7 veces.
3. En esta carpeta:
   ```bash
   zeus login
   zeus preview      # elige Cheetah Round; aparece un QR
   ```
4. En la app Zepp, ve a *Perfil → Ajustes → Modo desarrollador → Escanear* y escanea el QR. La app se instala en el reloj.

Para probarla sin reloj puedes usar el simulador de Zepp OS con `zeus dev`.

## Cómo decide si estás en pista

- Calcula tu distancia al trazado de cada pista cercana. En las pistas dibujadas como área, estar dentro del área cuenta como estar en pista.
- Estás **en pista** si estás a menos de 30 m del trazado.
- Pasas a **fuera de pista** si estás a más de 45 m durante 3 lecturas GPS seguidas, unos 3 segundos. Esto evita avisos falsos por el error normal del GPS en montaña.
- Si estás a menos de 15 m de un remonte y más cerca de él que de cualquier pista, se considera que vas en el remonte.

Los umbrales se cambian en `createTracker()`, dentro de `utils/geo.js`.

## Limitaciones

- **No es un dispositivo de seguridad.** La calidad depende de OpenStreetMap. Algunas pistas solo están dibujadas como una línea central y no como un área: en una pista muy ancha (más de 60 m) puedes estar en el borde y que la app te marque fuera. Puedes subir `onDist` y `offDist` si te pasa.
- La pantalla se mantiene encendida mientras la app está abierta, así que consume bastante batería. Ciérrala en los remontes largos si vas justo de batería.
- El mapa siempre tiene el norte arriba. La flecha que sale de tu punto indica hacia dónde te mueves.

## Estructura

| Archivo | Qué hace |
|---|---|
| `page/gt/home/index.page.js` | Pantalla del reloj: mapa, textos, GPS, vibración |
| `utils/geo.js` | Proyección, distancias, índice espacial y lógica en pista / fuera de pista |
| `scripts/fetch-pistes.mjs` | Descarga de OpenStreetMap, simplificación y generación de `data/pistes.js` |
| `test/` | Pruebas con `node --test` |

Datos © colaboradores de OpenStreetMap, licencia ODbL.
