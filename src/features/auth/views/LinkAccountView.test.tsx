import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const navigateMock = vi.hoisted(() => vi.fn())
const linkConfirmMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    linkConfirm: linkConfirmMock,
  }),
}))

import LinkAccountView from './LinkAccountView'

function renderLinkAccountView(initialEntry = '/link-account') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/link-account" element={<LinkAccountView />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LinkAccountView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an invalid-link state when the required params are missing', () => {
    renderLinkAccountView('/link-account?provider=google')

    expect(screen.getByText('Enlace inválido')).toBeInTheDocument()
    expect(linkConfirmMock).not.toHaveBeenCalled()
  })

  it('submits the linking payload and redirects to the library', async () => {
    const user = userEvent.setup()
    linkConfirmMock.mockResolvedValue(undefined)

    renderLinkAccountView('/link-account?link_token=link-token&provider=google&email=user%40test.com')

    await user.type(screen.getByLabelText('Contraseña actual'), 'Pass123$')
    await user.click(screen.getByRole('button', { name: 'Vincular con Google' }))

    await waitFor(() => {
      expect(linkConfirmMock).toHaveBeenCalledWith({
        linkToken: 'link-token',
        provider: 'google',
        email: 'user@test.com',
        password: 'Pass123$',
      })
    })

    expect(navigateMock).toHaveBeenCalledWith('/library', { replace: true })
  })

  it('shows the extracted error when linking fails', async () => {
    const user = userEvent.setup()
    linkConfirmMock.mockRejectedValue({ response: { data: 'Contraseña incorrecta.' } })

    renderLinkAccountView('/link-account?link_token=link-token&provider=github&email=user%40test.com')

    await user.type(screen.getByLabelText('Contraseña actual'), 'wrong-pass')
    await user.click(screen.getByRole('button', { name: 'Vincular con Github' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Contraseña incorrecta.')
  })
})
