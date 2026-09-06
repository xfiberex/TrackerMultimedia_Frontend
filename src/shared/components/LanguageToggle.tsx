import { useTranslation } from 'react-i18next'
import { useIdioma } from '@/shared/hooks/useIdioma'
import { NOMBRE_DE_IDIOMA, type Idioma } from '@/shared/i18n/idiomas'

/**
 * Interruptor de idioma, hermano del de tema y colocado a su lado.
 *
 * Con dos idiomas un interruptor basta y un desplegable sobra. Enseña **el idioma al
 * que se va**, no el actual, igual que el botón de tema enseña el sol cuando pulsarlo
 * lleva al modo claro.
 *
 * El texto del botón son las dos letras del código (`EN`, `ES`) porque una bandera no
 * identifica un idioma: el inglés no es de un país y el español todavía menos. El
 * nombre completo va en `aria-label` y en el `title`, y ahí sí escrito **en el idioma
 * de destino** —«Switch to English»—, que es el único que con seguridad entiende quien
 * está buscando ese botón.
 */
export default function LanguageToggle() {
  const { idioma, cambiarIdioma } = useIdioma()
  const { t } = useTranslation()

  const destino: Idioma = idioma === 'es' ? 'en' : 'es'
  const etiqueta = t('idioma.cambiarA', { idioma: NOMBRE_DE_IDIOMA[destino], lng: destino })

  return (
    <button
      className="theme-toggle theme-toggle--texto"
      type="button"
      onClick={() => cambiarIdioma(destino)}
      title={etiqueta}
      aria-label={etiqueta}
    >
      {destino.toUpperCase()}
    </button>
  )
}
