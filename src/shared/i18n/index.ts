import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { es } from './es'
import {
  IDIOMA_POR_DEFECTO,
  IDIOMA_STORAGE_KEY,
  IDIOMAS,
  esIdiomaValido,
  type Idioma,
} from './idiomas'

/**
 * T4-03 — La capa de textos.
 *
 * Se inicializa **al importar el módulo**, de forma síncrona y con los dos diccionarios
 * ya dentro del paquete. No hay carga por red ni `Suspense`: la alternativa —traer el
 * JSON del idioma cuando hace falta— añade un estado de «traduciendo» a cada pantalla y
 * un parpadeo de claves sin resolver, a cambio de ahorrar unos kilobytes de dos idiomas.
 *
 * Que sea síncrono también es lo que permite que las 189 pruebas unitarias sigan
 * funcionando sin envolver nada: basta con importar este módulo en el `setup` de vitest
 * y `useTranslation()` ya tiene idioma. Sin eso, cada prueba necesitaría un proveedor.
 */

function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(IDIOMA_STORAGE_KEY)
    if (esIdiomaValido(guardado)) return guardado
  } catch {
    // Ventana privada o almacenamiento bloqueado: se sigue al navegador.
  }

  // `navigator.language` viene como `es-DO`, `en-GB`…; solo interesa la parte del idioma.
  const delNavegador = globalThis.navigator?.language?.split('-')[0]
  return esIdiomaValido(delNavegador) ? delNavegador : IDIOMA_POR_DEFECTO
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { traduccion: es },
    en: { traduccion: en },
  },
  lng: idiomaInicial(),
  // El español es el idioma original, no una traducción más: si algo faltara en inglés
  // —cosa que `tsc` ya impide— saldría en español antes que en blanco.
  fallbackLng: IDIOMA_POR_DEFECTO,
  supportedLngs: IDIOMAS,
  defaultNS: 'traduccion',
  ns: ['traduccion'],
  interpolation: {
    // React ya escapa todo lo que interpola en JSX. Escapar aquí además convertía
    // los apóstrofos y las comillas de los propios textos en entidades HTML visibles.
    escapeValue: false,
  },
  returnNull: false,
  // i18next imprime en consola un anuncio de su producto comercial la primera vez que
  // arranca. En la salida de las pruebas es ruido que no dice nada del proyecto.
  showSupportNotice: false,
})

/**
 * Mantiene `lang` del documento al día.
 *
 * No es decorativo: de ese atributo dependen el corte de palabras, las comillas
 * tipográficas y, sobre todo, **con qué pronunciación lee la página un lector de
 * pantalla**. Una interfaz en inglés dentro de un documento declarado `lang="es"` se
 * lee en voz alta con fonética española.
 */
function sincronizarLangDelDocumento(idioma: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = idioma
  }
}

sincronizarLangDelDocumento(i18n.language)
i18n.on('languageChanged', sincronizarLangDelDocumento)

export default i18n
