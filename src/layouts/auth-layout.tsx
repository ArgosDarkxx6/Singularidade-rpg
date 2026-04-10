import { motion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';

const authBenefits = [
  'Crie ou entre em mesas privadas por código e convite.',
  'Centralize fichas, ordem, rolagens e compêndio dentro da campanha certa.',
  'Use uma shell mais limpa, premium e preparada para sessão real.'
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
          <div className="absolute inset-0 bg-[url('/assets/book_art/ornaments/paper-grain-a.jpg')] bg-cover opacity-10 mix-blend-screen" />
          <img
            src={isRegister ? '/assets/book_art/figures/yuji-uppercut-panel.png' : '/assets/book_art/figures/gojo-infinity-hero.png'}
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 h-[78vh] opacity-22"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <LogoLockup />

            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Singularidade RPG</p>
              <h2 className="mt-4 font-display text-6xl leading-none text-white xl:text-7xl">
                {isRegister ? 'Abra sua presença e entre em campanhas privadas.' : 'Volte para a sua rede de mesas.'}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-soft">
                Inspirado em dashboards premium, mas moldado para a sua energia azul: menos ruído, mais clareza e toda a campanha contextualizada dentro da mesa certa.
              </p>
            </div>

            <div className="grid max-w-2xl gap-3">
              {authBenefits.map((benefit) => (
                <div key={benefit} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
                  <p className="text-sm leading-6 text-soft">{benefit}</p>
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
