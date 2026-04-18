import { createBrowserRouter } from 'react-router-dom';
import { ProtectedAppShell } from '@layouts/protected-app-shell';
import { GuestLayout } from '@routes/guest-layout';
import { LegacyRouteRedirect } from '@routes/legacy-route-redirect';
import { NotFoundPage } from '@routes/not-found-page';
import { ProtectedLayout } from '@routes/protected-layout';
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
    hydrateFallbackElement: <Placeholder />,
    children: [
      {
        path: '/entrar',
        lazy: async () => ({ Component: (await import('@routes/login-page')).LoginPage })
      },
      {
        path: '/cadastro',
        lazy: async () => ({ Component: (await import('@routes/register-page')).RegisterPage })
      }
    ]
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        element: <ProtectedAppShell />,
        children: [
          {
            path: '/mesas',
            lazy: async () => ({ Component: (await import('@routes/mesas-page')).MesasPage })
          },
          {
            path: '/perfil',
            lazy: async () => ({ Component: (await import('@routes/profile-page')).ProfilePage })
          }
        ]
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
        lazy: async () => ({ Component: (await import('@layouts/mesa-layout')).MesaLayout }),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@routes/mesa-overview-page')).MesaOverviewPage })
          },
          {
            path: 'sessao',
            lazy: async () => ({ Component: (await import('@routes/mesa-session-page')).MesaSessionPage })
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
