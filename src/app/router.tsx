import { createBrowserRouter } from 'react-router-dom';
import { GuestLayout } from '@routes/guest-layout';
import { LoginPage } from '@routes/login-page';
import { NotFoundPage } from '@routes/not-found-page';
import { ProtectedLayout } from '@routes/protected-layout';
import { RegisterPage } from '@routes/register-page';
import { RootRedirect } from '@routes/root-redirect';

const Placeholder = () => <div className="text-sm text-soft">Carregando modulo...</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />
  },
  {
    path: '/',
    element: <GuestLayout />,
    children: [
      {
        path: '/entrar',
        element: <LoginPage />
      },
      {
        path: '/cadastro',
        element: <RegisterPage />
      }
    ]
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        path: '/fichas',
        lazy: async () => ({ Component: (await import('@routes/sheets-page')).SheetsPage })
      },
      {
        path: '/rolagens',
        lazy: async () => ({ Component: (await import('@routes/rolls-page')).RollsPage })
      },
      {
        path: '/ordem',
        lazy: async () => ({ Component: (await import('@routes/order-page')).OrderPage })
      },
      {
        path: '/livro',
        lazy: async () => ({ Component: (await import('@routes/compendium-page')).CompendiumPage })
      },
      {
        path: '/mesa',
        lazy: async () => ({ Component: (await import('@routes/mesa-page')).MesaPage })
      },
      {
        path: '/mesa/:slug',
        lazy: async () => ({ Component: (await import('@routes/mesa-room-page')).MesaRoomPage })
      }
    ],
    hydrateFallbackElement: <Placeholder />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
