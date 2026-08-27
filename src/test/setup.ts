import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

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
})
