import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'

const forgotPasswordMock = vi.hoisted(() => vi.fn())

vi.mock('../api/AuthAPI', () => ({
  AuthAPI: {
    forgotPassword: forgotPasswordMock,
  },
}))

import ForgotPasswordView from './ForgotPasswordView'

function renderForgotPasswordView() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the email and shows the confirmation state', async () => {
    const user = userEvent.setup()
    forgotPasswordMock.mockResolvedValue({ message: 'Recovery sent.' })

    renderForgotPasswordView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }))

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith({ email: 'user@test.com' })
    })

    expect(await screen.findByText('Revisa tu correo')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Si el correo existe, te enviaremos instrucciones para recuperar tu cuenta.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the extracted API error when the request fails', async () => {
    const user = userEvent.setup()
    forgotPasswordMock.mockRejectedValue({ response: { data: 'No se pudo enviar el correo.' } })

    renderForgotPasswordView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo enviar el correo.')
  })
})
