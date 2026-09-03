import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El script que aplica el tema antes del primer pintado va en línea en `index.html`,
 * y la CSP del proyecto prohíbe scripts en línea salvo que se declaren por hash.
 *
 * Ese acoplamiento falla de la peor manera posible: si alguien reformatea o edita el
 * script sin recalcular el hash, el navegador lo bloquea **en silencio** —vuelve el
 * destello de tema claro y no falla nada a la vista—. Ya pasó una vez, al pasar
 * Prettier por primera vez sobre el proyecto.
 *
 * De ahí este test: convierte un fallo mudo en uno ruidoso.
 */
describe('CSP de index.html', () => {
  const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8')

  it('declara el hash del script en línea que aplica el tema', () => {
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)
    expect(script, 'no se encontró ningún script en línea en index.html').not.toBeNull()

    const hashReal = `sha256-${createHash('sha256').update(script![1], 'utf8').digest('base64')}`
    const declarados = [...html.matchAll(/'(sha256-[^']+)'/g)].map((match) => match[1])

    expect(
      declarados,
      'el hash de la CSP no cuadra con el script. Si acabas de tocarlo, recalcúlalo: ' +
        `el valor correcto es '${hashReal}'`,
    ).toContain(hashReal)
  })

  it('no permite scripts en línea sin hash', () => {
    const csp = /Content-Security-Policy"[\s\S]*?content="([\s\S]*?)"/.exec(html)
    expect(csp).not.toBeNull()

    const scriptSrc = /script-src([^;]*)/.exec(csp![1])
    expect(scriptSrc).not.toBeNull()

    // Acotado a `script-src` a propósito: `style-src` sí lleva 'unsafe-inline' y lo
    // necesita. Lo que esto impide es resolver un problema de scripts abriendo la
    // política entera para lo que aquí se arregla con un hash.
    expect(scriptSrc![1]).not.toContain("'unsafe-inline'")
    expect(scriptSrc![1]).toContain("'self'")
  })
})
