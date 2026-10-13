import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from './App';
import Main from './pages/Main';
import store from './store/store';
import '@/localization/index';

import "./assets/scss/style.scss";

// Data router: обязателен для useMatches (используется в useTabTitle).
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Main />, handle: { tabTitle: 'tabTitle.offer' } },
      { path: 'main', element: <Main />, handle: { tabTitle: 'tabTitle.offer' } },
      { path: '*', element: <Main />, handle: { tabTitle: 'tabTitle.offer' } },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
