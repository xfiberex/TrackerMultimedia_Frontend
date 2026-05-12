import { describe, it, expect } from 'vitest'
import { normalizeError } from '@/features/auth/utils/authErrors'
import { sanitizeHtml, escapeHtml } from '@/shared/utils/sanitize'
import { validateField } from '@/shared/utils/validation'
import { z } from 'zod'

describe('Error Handling', () => {
  it('normalizeError categorizes network errors', () => {
    const networkError = {
      code: 'ERR_NETWORK',
      response: undefined,
    }
    const result = normalizeError(networkError)
    expect(result.type).toBe('network')
    expect(result.message).toContain('conexión')
  })

  it('normalizeError categorizes 401 as auth error', () => {
    const authError = {
      response: {
        status: 401,
        data: { detail: 'Credenciales inválidas' },
      },
    }
    const result = normalizeError(authError)
    expect(result.type).toBe('auth')
    expect(result.message).toBe('Credenciales inválidas')
  })

  it('normalizeError extracts validation errors', () => {
    const validationError = {
      response: {
        status: 400,
        data: {
          errors: {
            email: ['Email inválido'],
            password: ['Mínimo 8 caracteres'],
          },
        },
      },
    }
    const result = normalizeError(validationError)
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.errors).toBeDefined()
    }
  })

  it('normalizeError categorizes 500+ as server error', () => {
    const serverError = {
      response: {
        status: 500,
        data: { detail: 'Internal Server Error' },
      },
    }
    const result = normalizeError(serverError)
    expect(result.type).toBe('server')
  })
})

describe('HTML Sanitization', () => {
  it('sanitizeHtml removes script tags', () => {
    const dirty = 'Hello <script>alert("XSS")</script> World'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('<script>')
    expect(clean).toContain('Hello')
    expect(clean).toContain('World')
  })

  it('sanitizeHtml removes event handlers', () => {
    const dirty = '<img src="x" onerror="alert(\'XSS\')">'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('onerror')
  })

  it('escapeHtml preserves content without tags', () => {
    const text = 'This is <safe> text'
    const escaped = escapeHtml(text)
    expect(escaped).toContain('&lt;safe&gt;')
    expect(escaped).toContain('This is')
  })
})

describe('Field Validation', () => {
  it('validateField returns error for invalid email', () => {
    const emailSchema = z.string().email('Email inválido')
    const error = validateField(emailSchema, 'invalid')
    expect(error).toBe('Email inválido')
  })

  it('validateField returns null for valid input', () => {
    const emailSchema = z.string().email()
    const error = validateField(emailSchema, 'test@example.com')
    expect(error).toBeNull()
  })

  it('validateField validates minimum length', () => {
    const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres')
    const error = validateField(passwordSchema, 'short')
    expect(error).toBe('Mínimo 8 caracteres')
  })
})
