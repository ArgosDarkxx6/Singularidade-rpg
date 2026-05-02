import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@lib/utils';

export function V2Shell({
  rail,
  topbar,
  mobileNav,
  children
}: {
  rail: ReactNode;
  topbar: ReactNode;
  mobileNav: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative h-svh min-h-svh overflow-hidden bg-[#020711] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,109,255,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(58,210,255,0.08),transparent_18%),linear-gradient(180deg,rgba(5,13,24,0.98),rgba(1,5,11,1))]" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1900px] flex-col gap-2 p-2">
        {topbar}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[148px_minmax(0,1fr)]">
          {rail}
          {children}
        </div>
      </div>
      {mobileNav}
    </div>
  );
}

export const V2ScrollSurface = forwardRef<
  HTMLElement,
  HTMLAttributes<HTMLElement> & {
    children: ReactNode;
  }
>(function V2ScrollSurface({ children, className = '', ...props }, ref) {
  return (
    <main
      ref={ref}
      className={cn(
        'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-white/8 bg-[rgba(2,8,15,0.72)] px-3 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-4 sm:py-4',
        className
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-[1540px] pb-24 sm:pb-6">{children}</div>
    </main>
  );
});
