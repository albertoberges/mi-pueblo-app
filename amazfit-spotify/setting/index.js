// Pantalla de Ajustes (dentro de la app Zepp del iPhone).
import { buildAuthUrl, randomVerifier, REDIRECT_URI } from '../shared/spotify-auth'

const box = { border: '1px solid #ddd', borderRadius: '12px', padding: '12px', margin: '12px 0' }
const small = { fontSize: '13px', color: '#666', wordBreak: 'break-all' }

AppSettingsPage({
  build(props) {
    const s = props.settingsStorage
    const clientId = s.getItem('clientId') || ''
    const authUrl = s.getItem('authUrl') || ''
    const status = s.getItem('authStatus') || (s.getItem('tokens') ? '✅ Conectado' : 'Sin conectar')

    return View({ style: { padding: '12px 16px' } }, [
      Text({ bold: true, paragraph: true, style: { fontSize: '20px' } }, 'Spoti Mando'),
      Text({ paragraph: true, style: small }, 'Estado: ' + status),

      View({ style: box }, [
        Text({ bold: true, paragraph: true }, '1. Client ID de Spotify'),
        Text({ paragraph: true, style: small },
          'Créalo en developer.spotify.com/dashboard. Redirect URI: ' + REDIRECT_URI + ' · API: Web API'),
        TextInput({
          label: 'Client ID',
          value: clientId,
          placeholder: 'Pega aquí tu Client ID',
          onChange: (v) => s.setItem('clientId', (v || '').trim()),
        }),
      ]),

      View({ style: box }, [
        Text({ bold: true, paragraph: true }, '2. Generar enlace de acceso'),
        Button({
          label: 'Generar enlace',
          style: { borderRadius: '20px', background: '#1DB954', color: '#fff', marginTop: '8px' },
          onClick: () => {
            const id = s.getItem('clientId')
            if (!id) { s.setItem('authStatus', 'Primero pon tu Client ID'); return }
            const v = randomVerifier()
            s.setItem('verifier', v)
            s.setItem('authUrl', buildAuthUrl(id, v))
            s.setItem('authStatus', 'Enlace listo: cópialo y ábrelo en Safari')
          },
        }),
        authUrl
          ? TextInput({ label: 'Mantén pulsado y copia este enlace', value: authUrl, onChange: () => {} })
          : null,
        Text({ paragraph: true, style: small },
          'Ábrelo en Safari y acepta. Safari dirá que no puede abrir la página: es normal. Copia la URL de la barra de direcciones.'),
      ]),

      View({ style: box }, [
        Text({ bold: true, paragraph: true }, '3. Pega la URL a la que te mandó Spotify'),
        TextInput({
          label: 'URL con ?code=…',
          value: '',
          placeholder: 'http://127.0.0.1:8888/callback?code=…',
          onChange: (v) => {
            s.setItem('authRedirect', v)
            s.setItem('authStatus', '⏳ Conectando… (abre la app en el reloj si no cambia)')
          },
        }),
      ]),

      Button({
        label: 'Desconectar',
        style: { marginTop: '16px', borderRadius: '20px' },
        onClick: () => {
          ;['tokens', 'authRedirect', 'usedCode', 'authUrl', 'verifier'].forEach((k) => s.removeItem(k))
          s.setItem('authStatus', 'Sin conectar')
        },
      }),
    ].filter(Boolean))
  },
})
