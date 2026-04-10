import { createBrowserRouter } from 'react-router-dom';
import { MesaLayout } from '@layouts/mesa-layout';
import { GuestLayout } from '@routes/guest-layout';
import { LegacyRouteRedirect } from '@routes/legacy-route-redirect';
import { LoginPage } from '@routes/login-page';
import { MesasPage } from '@routes/mesas-page';
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
        path: '/mesas',
        element: <MesasPage />
      },
      {
        path: '/fichas',
        element: <LegacyRouteRedirect section="fichas" />
      },
      {
        path: '/rolagens',
        element: <LegacyRouteRedirect section="rolagens" />
      },
      {
        path: '/ordem',
        element: <LegacyRouteRedirect section="ordem" />
      },
      {
        path: '/livro',
        element: <LegacyRouteRedirect section="livro" />
      },
      {
        path: '/mesa',
        element: <LegacyRouteRedirect />
      },
      {
        path: '/mesa/:slug',
        element: <MesaLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@routes/mesa-overview-page')).MesaOverviewPage })
          },
          {
            path: 'fichas',
            lazy: async () => ({ Component: (await import('@routes/mesa-sheets-page')).MesaSheetsPage })
          },
          {
            path: 'rolagens',
            lazy: async () => ({ Component: (await import('@routes/mesa-rolls-page')).MesaRollsPage })
          },
          {
            path: 'ordem',
            lazy: async () => ({ Component: (await import('@routes/mesa-order-page')).MesaOrderPage })
          },
          {
            path: 'livro',
            lazy: async () => ({ Component: (await import('@routes/mesa-compendium-page')).MesaCompendiumPage })
          },
          {
            path: 'membros',
            lazy: async () => ({ Component: (await import('@routes/mesa-members-page')).MesaMembersPage })
          },
          {
            path: 'configuracoes',
            lazy: async () => ({ Component: (await import('@routes/mesa-settings-page')).MesaSettingsPage })
          }
        ]
      }
    ],
    hydrateFallbackElement: <Placeholder />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
