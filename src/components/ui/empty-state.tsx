import { motion } from 'framer-motion';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4"
    >
      <h3 className="font-display text-base font-semibold leading-tight text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-soft">{body}</p>
    </motion.div>
  );
}
