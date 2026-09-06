import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
// i18next se inicializa al importarlo y de forma síncrona, así que con esta línea
// `useTranslation()` funciona en cualquier prueba sin envolver el árbol en un proveedor.
import i18n from '@/shared/i18n'

// El idioma de las pruebas se fija a mano y no se hereda del entorno.
//
// En jsdom `navigator.language` es `en-US`, así que sin esta línea la suite entera se
// renderiza en inglés y las 189 pruebas que localizan por texto en español dejan de
// encontrar nada. Fijarlo aquí es además lo correcto: una prueba que cambie de idioma
// según la máquina donde se ejecute no comprueba lo mismo en dos sitios.
//
// Una prueba que quiera comprobar el inglés llama a `i18n.changeLanguage('en')` y lo
// deja dicho; el `afterEach` de abajo devuelve el idioma al español.
void i18n.changeLanguage('es')

// jsdom no implementa matchMedia. Sin este stub, cualquier componente que use
// useDarkMode revienta con "window.matchMedia is not a function" y arrastra consigo
// todo el árbol que lo contenga (AppLayout, entre otros).
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

afterEach(() => {
  cleanup()
  // Que una prueba cambie de idioma no puede alterar a las siguientes: el orden de
  // ejecución no está garantizado y el fallo saldría en una prueba que no lo causó.
  if (i18n.language !== 'es') {
    void i18n.changeLanguage('es')
  }
})
