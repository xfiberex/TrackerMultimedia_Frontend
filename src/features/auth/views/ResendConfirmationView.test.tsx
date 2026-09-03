import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'

const resendConfirmationMock = vi.hoisted(() => vi.fn())

vi.mock('../api/AuthAPI', () => ({
  AuthAPI: {
    resendConfirmation: resendConfirmationMock,
  },
}))

import ResendConfirmationView from './ResendConfirmationView'

function renderResendConfirmationView() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/resend-confirmation']}>
        <Routes>
          <Route path="/resend-confirmation" element={<ResendConfirmationView />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ResendConfirmationView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the email and shows the sent state', async () => {
    const user = userEvent.setup()
    resendConfirmationMock.mockResolvedValue({ message: 'Sent.' })

    renderResendConfirmationView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    await waitFor(() => {
      expect(resendConfirmationMock).toHaveBeenCalledWith({ email: 'user@test.com' })
    })

    expect(await screen.findByText('Correo enviado')).toBeInTheDocument()
    expect(screen.getByText('user@test.com')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Si existe una cuenta sin confirmar para user@test.com, enviaremos un nuevo enlace.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the extracted API error when resending fails', async () => {
    const user = userEvent.setup()
    resendConfirmationMock.mockRejectedValue({ response: { data: 'No se pudo reenviar.' } })

    renderResendConfirmationView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo reenviar.')
  })
})
