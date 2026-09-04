import { downloadBlob, resolveDownloadFileName } from './download'

describe('resolveDownloadFileName', () => {
  it('falls back when there is no header', () => {
    expect(resolveDownloadFileName(undefined, 'copia.json')).toBe('copia.json')
  })

  it('prefers the UTF-8 variant, which is the one that carries accents intact', () => {
    const header =
      "attachment; filename=tracker-biblioteca.json; filename*=UTF-8''tracker-biblioteca-espa%C3%B1ol.json"

    expect(resolveDownloadFileName(header, 'copia.json')).toBe('tracker-biblioteca-español.json')
  })

  it('reads the quoted plain variant', () => {
    expect(resolveDownloadFileName('attachment; filename="tracker.json"', 'copia.json')).toBe(
      'tracker.json',
    )
  })

  it('falls back when the header carries no file name', () => {
    expect(resolveDownloadFileName('attachment', 'copia.json')).toBe('copia.json')
  })
})

describe('downloadBlob', () => {
  it('releases the object URL and leaves no anchor behind', () => {
    const createObjectURL = vi.fn(() => 'blob:x')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true })

    downloadBlob(new Blob(['{}']), 'datos.json')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
    // El anclaje es temporal: si quedara en el DOM, cada descarga dejaría un enlace suelto.
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
