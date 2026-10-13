import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'

import store from '@/store/store'
import i18n from '@/localization'

interface ProvidersProps {
  children: ReactNode
  route?: string
}

function Providers({ children, route = '/' }: ProvidersProps) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </I18nextProvider>
    </Provider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

// Обёртка с провайдерами Redux + i18n + Router.
// В тестах используем MemoryRouter, а не BrowserRouter.
export function renderWithProviders(
  ui: ReactElement,
  { route, ...options }: CustomRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => <Providers route={route}>{children}</Providers>,
    ...options,
  })
}

export * from '@testing-library/react'
