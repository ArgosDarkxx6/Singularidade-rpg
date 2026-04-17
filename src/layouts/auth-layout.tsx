import { motion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';

const platformNotes = [
  { label: 'Mesas', value: 'Privadas por sistema' },
  { label: 'Acesso', value: 'Convites e códigos' },
  { label: 'Expansão', value: 'Novos sistemas depois' }
];

const authBenefits = [
  'Seu portal fica separado das regras de cada universo.',
  'Cada mesa mantém membros, fichas, rolagens e permissões próprias.',
  'Singularidade continua disponível como o primeiro sistema ativo.'
];

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.startsWith('/cadastro');

  return (
    <div className="platform-shell min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1560px] overflow-hidden rounded-lg border border-white/10 bg-black/35 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-white/10 bg-white/[0.025] lg:flex">
          <div className="flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <LogoLockup />

            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Project Nexus</p>
              <h2 className="mt-4 text-balance font-display text-5xl leading-none text-white sm:text-6xl xl:text-7xl">
                {isRegister ? 'Crie sua conta e escolha seu primeiro universo.' : 'Entre no seu hub de campanhas.'}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-soft">
                Unindo universos, criando histórias. Mesas, sistemas e pessoas ficam no mesmo lugar sem misturar identidades de jogo.
              </p>
            </div>

            <div className="grid max-w-2xl gap-3">
              {authBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4">
                  <span className="mt-1 size-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(78,140,255,0.32)]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-soft">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3 pt-2">
              {platformNotes.map((marker) => (
                <div key={marker.label} className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{marker.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{marker.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel-strong w-full max-w-[560px] rounded-lg p-6 sm:p-8"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
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
