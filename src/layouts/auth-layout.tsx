import { motion } from 'framer-motion';
import { Link, Outlet } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <img
        src="/assets/book_art/ornaments/ritual-ring-2.png"
        alt=""
        className="pointer-events-none absolute -right-20 top-[-80px] w-[460px] max-w-none opacity-25"
      />
      <img
        src="/assets/book_art/figures/gojo-infinity-hero.png"
        alt=""
        className="pointer-events-none absolute bottom-0 right-0 hidden h-[78vh] opacity-22 xl:block"
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] overflow-hidden rounded-[36px] border border-white/8 bg-slate-950/65 shadow-[0_40px_120px_rgba(2,8,15,0.55)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(87,187,255,0.25),transparent_28%),linear-gradient(160deg,rgba(9,20,31,0.92),rgba(5,13,21,0.98))]" />
          <div className="absolute inset-0 bg-[url('/assets/book_art/ornaments/paper-grain-a.jpg')] bg-cover opacity-8 mix-blend-screen" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <LogoLockup />
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Mesa, livro e presenca online</p>
              <h2 className="mt-4 font-display text-6xl leading-none text-white xl:text-7xl">Um grimorio operacional para campanha, combate e sessao.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-soft">
                O remake reorganiza fichas, rolagens, ordem, compendio e mesa online em uma shell unica, responsiva e pronta para crescer.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/3 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Fichas</p>
                <p className="mt-2 text-sm text-soft">Roster, avatar, tecnicas, votos, condicoes e inventario.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/3 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Mesa</p>
                <p className="mt-2 text-sm text-soft">Links, codigos, snapshots, presenca e restore.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/3 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Livro</p>
                <p className="mt-2 text-sm text-soft">Capitulos editoriais, glossario, busca e PDF.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel-strong w-full max-w-xl rounded-[32px] p-6 sm:p-8"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <LogoLockup compact className="lg:hidden" />
              <Link to="/fichas" className="text-xs font-semibold uppercase tracking-[0.2em] text-soft hover:text-white">
                Ver demo local
              </Link>
            </div>
            <Outlet />
          </motion.div>
        </section>
      </div>
    </div>
  );
}
