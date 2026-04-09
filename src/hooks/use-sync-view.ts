import { useEffect } from 'react';
import type { AppView } from '@/types/domain';
import { useWorkspace } from '@features/workspace/use-workspace';

export function useSyncView(view: AppView) {
  const { setView, state } = useWorkspace();

  useEffect(() => {
    if (state.currentView === view) return;
    setView(view);
  }, [setView, state.currentView, view]);
}

