import { motion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.startsWith('/cadastro');

  return (
    <div className="platform-shell min-h-screen px-3 py-3 sm:px-4 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1420px] overflow-hidden rounded-[12px] border border-white/10 bg-black/24 shadow-[0_28px_84px_rgba(0,0,0,0.44)] backdrop-blur-xl lg:grid-cols-[0.92fr_0.8fr]">
        <section className="hidden border-r border-white/9 bg-white/[0.018] lg:flex">
          <div className="flex h-full w-full flex-col justify-between p-4 xl:p-5">
            <LogoLockup />

            <div className="max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Acesso</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight text-white">
                {isRegister ? 'Crie sua conta.' : 'Entre no Nexus.'}
              </h2>
            </div>

            <div className="flex max-w-xl items-center gap-3 border-t border-white/8 pt-4">
              <span className="size-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(78,140,255,0.38)]" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Conta protegida</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-5">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel-strong w-full max-w-[500px] rounded-[12px] p-5"
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
