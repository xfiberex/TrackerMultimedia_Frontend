import i18n from '@/shared/i18n'
import type { es } from './es'

/**
 * Mensaje de validación traducido **en el momento de validar**, no al importar.
 *
 * Los esquemas de Zod son constantes de módulo: se construyen una sola vez, al cargar la
 * aplicación. Un `i18n.t(...)` escrito ahí dentro se evaluaría entonces y dejaría el
 * mensaje congelado en el idioma de arranque, de modo que cambiar a inglés traduciría
 * toda la pantalla menos los errores del formulario.
 *
 * Zod evalúa `error` en cada `parse`, así que envolverlo en una función es lo que hace
 * que el mensaje siga al idioma actual.
 */
export const mensaje = (clave: `validacion.${keyof typeof es.validacion}`) => ({
  error: () => i18n.t(clave),
})
