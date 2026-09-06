import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IDIOMA_POR_DEFECTO,
  IDIOMA_STORAGE_KEY,
  esIdiomaValido,
  type Idioma,
} from '@/shared/i18n/idiomas'

/**
 * El idioma actual y cómo cambiarlo.
 *
 * A diferencia de `useDarkMode`, aquí **no** hay tercer estado «seguir al sistema»: el
 * idioma del navegador solo decide el de partida, en `i18n/index.ts`. Cambiar el idioma
 * del sistema operativo con la aplicación abierta no debería recolocar los textos a
 * media frase, y quien ha elegido uno de los dos idiomas ha elegido, no ha pedido que se
 * le siga adivinando.
 */
export function useIdioma() {
  const { i18n } = useTranslation()

  const idioma: Idioma = esIdiomaValido(i18n.language) ? i18n.language : IDIOMA_POR_DEFECTO

  const cambiarIdioma = useCallback(
    (siguiente: Idioma) => {
      // `changeLanguage` avisa a todos los componentes montados; por eso el cambio se
      // ve sin recargar y sin perder el estado de la pantalla en la que se está.
      void i18n.changeLanguage(siguiente)

      try {
        localStorage.setItem(IDIOMA_STORAGE_KEY, siguiente)
      } catch {
        // Sin almacenamiento el idioma no sobrevive a la recarga, pero la sesión sí.
      }
    },
    [i18n],
  )

  return { idioma, cambiarIdioma }
}
