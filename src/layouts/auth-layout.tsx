import { motion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';

const authBenefits = [
  'Crie ou entre em mesas privadas por código e convite.',
  'Centralize fichas, ordem, rolagens e compêndio dentro da campanha certa.',
  'Use uma shell mais limpa, premium e preparada para sessão real.'
];

const orbitMarkers = [
  { label: 'Mesa', value: 'Privada' },
  { label: 'Sessão', value: 'Contextual' },
  { label: 'Acesso', value: 'Por convite' }
];

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.startsWith('/cadastro');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,rgba(4,8,15,1),rgba(7,12,19,1))] px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,187,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(78,140,255,0.12),transparent_24%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1560px] overflow-hidden rounded-[36px] border border-white/8 bg-slate-950/78 shadow-[0_40px_120px_rgba(2,8,15,0.55)] backdrop-blur-xl lg:grid-cols-[1.12fr_0.88fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(87,187,255,0.24),transparent_22%),radial-gradient(circle_at_68%_74%,rgba(78,140,255,0.16),transparent_26%),linear-gradient(160deg,rgba(7,13,22,0.94),rgba(4,9,16,0.98))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(87,187,255,0.12),transparent_20%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.08),transparent_18%)]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-7rem] top-24 size-[28rem] rounded-full border border-sky-300/12 bg-[radial-gradient(circle,rgba(87,187,255,0.18),rgba(87,187,255,0.04)_55%,transparent_70%)] blur-3xl" />
            <div className="absolute bottom-[-8rem] right-[-6rem] size-[32rem] rounded-full border border-blue-300/10 bg-[radial-gradient(circle,rgba(78,140,255,0.18),rgba(78,140,255,0.04)_50%,transparent_72%)] blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 bg-[conic-gradient(from_180deg,rgba(59,130,246,0.18),rgba(14,165,233,0.04),rgba(59,130,246,0.18))] opacity-70" />
            <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-[radial-gradient(circle,rgba(7,13,22,0.82),rgba(7,13,22,0.2)_65%,transparent_72%)]" />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <LogoLockup />

            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Singularidade RPG</p>
            <h2 className="mt-4 text-balance font-display text-5xl leading-none text-white sm:text-6xl xl:text-7xl">
                {isRegister ? 'Abra sua presença e entre em campanhas privadas.' : 'Volte para a sua rede de mesas.'}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-soft">
                Uma entrada limpa, contextual e discreta para o seu painel de campanha. Menos ruído, mais foco, e tudo alinhado à mesa certa.
              </p>
            </div>

            <div className="grid max-w-2xl gap-3">
              {authBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
                  <span className="mt-1 size-2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(87,187,255,0.4)]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-soft">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3 pt-2">
              {orbitMarkers.map((marker) => (
                <div key={marker.label} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">{marker.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{marker.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel-strong w-full max-w-[560px] rounded-[32px] p-6 sm:p-8"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <LogoLockup compact className="lg:hidden" />
              <Link to={isRegister ? '/entrar' : '/cadastro'} className="text-xs font-semibold uppercase tracking-[0.2em] text-soft transition hover:text-white">
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
