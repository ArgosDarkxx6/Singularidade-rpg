import { motion } from 'framer-motion';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-5 py-6"
    >
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-soft">{body}</p>
    </motion.div>
  );
}
