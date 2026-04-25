import { motion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';

const platformNotes = [
  { label: 'Mesas', value: 'Privadas por sistema' },
  { label: 'Acesso', value: 'Convites e códigos' },
  { label: 'Sessão', value: 'Retomada rápida' }
];

const authBenefits = [
  'Acesse direto suas mesas e volte para a ação em segundos.',
  'Cada mesa mantém seu próprio estado e seus próprios acessos.',
  'Login com email ou username em fluxo único.'
];

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.startsWith('/cadastro');

  return (
    <div className="platform-shell min-h-screen px-3 py-3 sm:px-4 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1540px] overflow-hidden rounded-lg border border-white/12 bg-black/30 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden border-r border-white/10 bg-white/[0.025] lg:flex">
          <div className="flex h-full w-full flex-col justify-between p-5 xl:p-6">
            <LogoLockup />

            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Project Nexus</p>
              <h2 className="mt-3 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl xl:text-4xl">
                {isRegister ? 'Crie sua conta para abrir a plataforma.' : 'Entre no seu hub de mesas.'}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-soft">
                Operação de mesa, fichas, rolagens e controle de acesso no mesmo fluxo.
              </p>
            </div>

            <div className="grid max-w-2xl gap-2.5">
              {authBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3.5">
                  <span className="mt-1 size-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(78,140,255,0.32)]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-soft">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-2.5 pt-2">
              {platformNotes.map((marker) => (
                <div key={marker.label} className="rounded-lg border border-white/10 bg-white/[0.035] px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{marker.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{marker.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-5">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel-strong w-full max-w-[520px] rounded-lg p-5"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <LogoLockup compact className="lg:hidden" />
              <Link to={isRegister ? '/entrar' : '/cadastro'} className="text-xs font-semibold uppercase tracking-[0.18em] text-soft transition hover:text-white">
                {isRegister ? 'Já possui conta?' : 'Criar conta'}
              </Link>
            </div>
            <Outlet />
          </motion.div>
        </section>
      </div>
    </div>
  );
}
