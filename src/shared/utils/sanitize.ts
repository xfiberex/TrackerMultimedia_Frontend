import DOMPurify from 'dompurify'

/**
 * Sanitiza HTML para prevenir ataques XSS.
 * Usa DOMPurify con configuración segura por defecto.
 *
 * Por defecto elimina todo excepto text nodes y espacios en blanco.
 * Usa `allowedTags` para permitir tags específicas.
 */
export function sanitizeHtml(
  html: string,
  allowedTags: string[] = [],
): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Escapa caracteres HTML especiales sin remover el contenido.
 * Útil para mostrar texto que podría contener HTML como texto literal.
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Sanitiza permitiendo solo tags de formateo básico (bold, italic, links).
 */
export function sanitizeFormattedText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    KEEP_CONTENT: true,
  })
}

/**
 * Markup con DOMPurify para React.
 * Retorna un objeto seguro para usar en dangerouslySetInnerHTML.
 * NOTA: Solo usar con contenido de confianza o sanitizado previamente.
 */
export function createMarkup(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html),
  }
}
