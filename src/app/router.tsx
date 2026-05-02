import { createBrowserRouter, Navigate } from 'react-router-dom';
import { NexusPlatformLayout } from '@layouts/nexus-platform-layout';
import { GuestLayout } from '@routes/guest-layout';
import { LegacyRouteRedirect } from '@routes/legacy-route-redirect';
import { NotFoundPage } from '@routes/not-found-page';
import { ProtectedLayout } from '@routes/protected-layout';
import { RootRedirect } from '@routes/root-redirect';

const Placeholder = () => <div className="text-sm text-soft">Carregando módulo...</div>;

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
        element: <NexusPlatformLayout />,
        children: [
          {
            path: '/hub',
            lazy: async () => ({ Component: (await import('@routes/hub-page')).HubPage })
          },
          {
            path: '/mesas',
            lazy: async () => ({ Component: (await import('@routes/mesas-page')).MesasPage })
          },
          {
            path: '/convites',
            lazy: async () => ({ Component: (await import('@routes/invites-page')).InvitesPage })
          },
          {
            path: '/conta',
            lazy: async () => ({ Component: (await import('@routes/profile-page')).ProfilePage })
          },
          {
            path: '/personagens',
            lazy: async () => ({ Component: (await import('@routes/my-characters-page')).MyCharactersPage })
          },
          {
            path: '/perfil',
            element: <Navigate to="/conta" replace />
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
            lazy: async () => ({ Component: (await import('@routes/mesa-legacy-section-redirect')).MesaLegacySessionRedirect })
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
            lazy: async () => ({ Component: (await import('@routes/mesa-legacy-section-redirect')).MesaLegacyMembersRedirect })
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
