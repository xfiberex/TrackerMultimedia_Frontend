import type { es } from './es'

/**
 * Tipa las claves de traducción a partir del diccionario español.
 *
 * Con esto, `t('cabecera.salirr')` no compila y `t('perfil.titulo')` se autocompleta.
 * Es la red que hace practicable una migración de ~500 textos: en una capa de i18n sin
 * tipar, una clave mal escrita no falla en ninguna parte —devuelve la propia clave— y
 * aparece en pantalla como `cabecera.salirr` el día que alguien abre esa vista.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'traduccion'
    resources: {
      traduccion: typeof es
    }
  }
}
