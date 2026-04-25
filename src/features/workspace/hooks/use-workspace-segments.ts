import { useMemo } from 'react';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';

export function usePlatformHub() {
  const workspace = useWorkspace();
  const auth = useAuth();

  return useMemo(
    () => ({
      user: auth.user,
      profile: auth.profile,
      tables: workspace.tables,
      online: workspace.online,
      previewInvite: workspace.previewInvite,
      listUserCharacters: workspace.listUserCharacters
    }),
    [auth.profile, auth.user, workspace.listUserCharacters, workspace.online, workspace.previewInvite, workspace.tables]
  );
}

export function usePlatformTables() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      tables: workspace.tables,
      online: workspace.online,
      createTableSession: workspace.createTableSession,
      switchTable: workspace.switchTable,
      connectToInvite: workspace.connectToInvite,
      connectToJoinCode: workspace.connectToJoinCode,
      refreshTables: workspace.refreshTables
    }),
    [
      workspace.connectToInvite,
      workspace.connectToJoinCode,
      workspace.createTableSession,
      workspace.online,
      workspace.refreshTables,
      workspace.switchTable,
      workspace.tables
    ]
  );
}

export function useAccountCharacters() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      online: workspace.online,
      tables: workspace.tables,
      listUserCharacters: workspace.listUserCharacters,
      listCharacterCores: workspace.listCharacterCores,
      createCharacterCore: workspace.createCharacterCore,
      importCharacterCoreFromJson: workspace.importCharacterCoreFromJson,
      createTableCharacterFromCore: workspace.createTableCharacterFromCore,
      transferCharacterCoreOwnership: workspace.transferCharacterCoreOwnership
    }),
    [
      workspace.createCharacterCore,
      workspace.createTableCharacterFromCore,
      workspace.importCharacterCoreFromJson,
      workspace.listCharacterCores,
      workspace.listUserCharacters,
      workspace.online,
      workspace.tables,
      workspace.transferCharacterCoreOwnership
    ]
  );
}

export function usePlatformInvites() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      online: workspace.online,
      previewInvite: workspace.previewInvite,
      connectToInvite: workspace.connectToInvite,
      connectToJoinCode: workspace.connectToJoinCode
    }),
    [workspace.connectToInvite, workspace.connectToJoinCode, workspace.online, workspace.previewInvite]
  );
}

export function useMesaShell() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      isReady: workspace.isReady,
      online: workspace.online,
      tables: workspace.tables,
      table: workspace.online.table,
      session: workspace.online.session,
      members: workspace.online.members,
      currentSession: workspace.online.currentSession,
      switchTable: workspace.switchTable,
      connectToInvite: workspace.connectToInvite,
      previewInvite: workspace.previewInvite,
      leaveCurrentTable: workspace.leaveCurrentTable
    }),
    [
      workspace.connectToInvite,
      workspace.isReady,
      workspace.leaveCurrentTable,
      workspace.online,
      workspace.previewInvite,
      workspace.switchTable,
      workspace.tables
    ]
  );
}

export function useMesaOverview() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      state: workspace.state,
      activeCharacter: workspace.activeCharacter,
      online: workspace.online,
      createInviteLink: workspace.createInviteLink,
      createJoinCode: workspace.createJoinCode,
      revokeJoinCode: workspace.revokeJoinCode,
      createCloudSnapshot: workspace.createCloudSnapshot,
      restoreCloudSnapshot: workspace.restoreCloudSnapshot,
      createGameSession: workspace.createGameSession,
      updateGameSession: workspace.updateGameSession,
      startGameSession: workspace.startGameSession,
      endGameSession: workspace.endGameSession,
      markSessionAttendance: workspace.markSessionAttendance,
      clearSessionAttendance: workspace.clearSessionAttendance,
      updateTableMeta: workspace.updateTableMeta,
      refreshTables: workspace.refreshTables
    }),
    [
      workspace.activeCharacter,
      workspace.clearSessionAttendance,
      workspace.createCloudSnapshot,
      workspace.createGameSession,
      workspace.createInviteLink,
      workspace.createJoinCode,
      workspace.endGameSession,
      workspace.markSessionAttendance,
      workspace.online,
      workspace.refreshTables,
      workspace.restoreCloudSnapshot,
      workspace.revokeJoinCode,
      workspace.startGameSession,
      workspace.state,
      workspace.updateGameSession,
      workspace.updateTableMeta
    ]
  );
}

export function useMesaCharacters() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      state: workspace.state,
      online: workspace.online,
      activeCharacter: workspace.activeCharacter,
      hasBoundSheet: workspace.hasBoundSheet,
      canAccessSheetsModule: workspace.canAccessSheetsModule,
      canManageRoster: workspace.canManageRoster,
      hasPendingBoundSheet: workspace.hasPendingBoundSheet,
      boundSheetCharacterId: workspace.boundSheetCharacterId,
      listCharacterCores: workspace.listCharacterCores,
      createCharacterCore: workspace.createCharacterCore,
      importCharacterCoreFromJson: workspace.importCharacterCoreFromJson,
      createTableCharacterFromCore: workspace.createTableCharacterFromCore,
      exportState: workspace.exportState,
      exportActiveCharacterJson: workspace.exportActiveCharacterJson,
      setActiveCharacter: workspace.setActiveCharacter,
      addCharacter: workspace.addCharacter,
      removeCharacter: workspace.removeCharacter,
      updateCharacterField: workspace.updateCharacterField,
      updateCharacterLore: workspace.updateCharacterLore,
      setCharacterAvatar: workspace.setCharacterAvatar,
      uploadCharacterAvatar: workspace.uploadCharacterAvatar,
      clearCharacterAvatar: workspace.clearCharacterAvatar,
      addCharacterGalleryImage: workspace.addCharacterGalleryImage,
      uploadCharacterGalleryImage: workspace.uploadCharacterGalleryImage,
      updateCharacterGalleryImage: workspace.updateCharacterGalleryImage,
      removeCharacterGalleryImage: workspace.removeCharacterGalleryImage,
      reorderCharacterGallery: workspace.reorderCharacterGallery,
      setAttributeValue: workspace.setAttributeValue,
      setAttributeRank: workspace.setAttributeRank,
      adjustResource: workspace.adjustResource,
      setResourceCurrent: workspace.setResourceCurrent,
      setResourceMax: workspace.setResourceMax,
      saveCollectionItem: workspace.saveCollectionItem,
      removeCollectionItem: workspace.removeCollectionItem,
      setInventoryMoney: workspace.setInventoryMoney,
      addCondition: workspace.addCondition,
      removeCondition: workspace.removeCondition
    }),
    [
      workspace.activeCharacter,
      workspace.addCharacter,
      workspace.addCharacterGalleryImage,
      workspace.addCondition,
      workspace.adjustResource,
      workspace.boundSheetCharacterId,
      workspace.canAccessSheetsModule,
      workspace.canManageRoster,
      workspace.clearCharacterAvatar,
      workspace.createCharacterCore,
      workspace.createTableCharacterFromCore,
      workspace.exportActiveCharacterJson,
      workspace.exportState,
      workspace.hasBoundSheet,
      workspace.hasPendingBoundSheet,
      workspace.importCharacterCoreFromJson,
      workspace.listCharacterCores,
      workspace.online,
      workspace.removeCharacter,
      workspace.removeCharacterGalleryImage,
      workspace.removeCollectionItem,
      workspace.removeCondition,
      workspace.reorderCharacterGallery,
      workspace.saveCollectionItem,
      workspace.setActiveCharacter,
      workspace.setAttributeRank,
      workspace.setAttributeValue,
      workspace.setCharacterAvatar,
      workspace.setInventoryMoney,
      workspace.setResourceCurrent,
      workspace.setResourceMax,
      workspace.state,
      workspace.updateCharacterField,
      workspace.updateCharacterGalleryImage,
      workspace.updateCharacterLore,
      workspace.uploadCharacterAvatar,
      workspace.uploadCharacterGalleryImage
    ]
  );
}

export function useMesaRolls() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      state: workspace.state,
      online: workspace.online,
      lastRoll: workspace.lastRoll,
      executeAttributeRoll: workspace.executeAttributeRoll,
      executeCustomRoll: workspace.executeCustomRoll,
      clearLog: workspace.clearLog
    }),
    [workspace.clearLog, workspace.executeAttributeRoll, workspace.executeCustomRoll, workspace.lastRoll, workspace.online, workspace.state]
  );
}

export function useMesaOrder() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      state: workspace.state,
      online: workspace.online,
      addCombatant: workspace.addCombatant,
      removeCombatant: workspace.removeCombatant,
      updateOrderNotes: workspace.updateOrderNotes,
      rollOrderInitiative: workspace.rollOrderInitiative,
      manualSortOrder: workspace.manualSortOrder,
      goToNextTurn: workspace.goToNextTurn,
      resetOrder: workspace.resetOrder,
      adjustCriticalFailures: workspace.adjustCriticalFailures
    }),
    [
      workspace.addCombatant,
      workspace.adjustCriticalFailures,
      workspace.goToNextTurn,
      workspace.manualSortOrder,
      workspace.online,
      workspace.removeCombatant,
      workspace.resetOrder,
      workspace.rollOrderInitiative,
      workspace.state,
      workspace.updateOrderNotes
    ]
  );
}

export function useMesaInvites() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      online: workspace.online,
      previewInvite: workspace.previewInvite,
      createInviteLink: workspace.createInviteLink,
      createJoinCode: workspace.createJoinCode,
      revokeJoinCode: workspace.revokeJoinCode
    }),
    [workspace.createInviteLink, workspace.createJoinCode, workspace.online, workspace.previewInvite, workspace.revokeJoinCode]
  );
}

export function useMesaSettings() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      online: workspace.online,
      updateTableMeta: workspace.updateTableMeta,
      createCloudSnapshot: workspace.createCloudSnapshot,
      restoreCloudSnapshot: workspace.restoreCloudSnapshot,
      transferTableOwnership: workspace.transferTableOwnership,
      deleteCurrentTable: workspace.deleteCurrentTable,
      leaveCurrentTable: workspace.leaveCurrentTable
    }),
    [
      workspace.createCloudSnapshot,
      workspace.deleteCurrentTable,
      workspace.leaveCurrentTable,
      workspace.online,
      workspace.restoreCloudSnapshot,
      workspace.transferTableOwnership,
      workspace.updateTableMeta
    ]
  );
}

export function useMesaCompendium() {
  const workspace = useWorkspace();

  return useMemo(
    () => ({
      online: workspace.online,
      compendiumCategory: workspace.compendiumCategory,
      compendiumQuery: workspace.compendiumQuery,
      setCompendiumCategory: workspace.setCompendiumCategory,
      setCompendiumQuery: workspace.setCompendiumQuery
    }),
    [
      workspace.compendiumCategory,
      workspace.compendiumQuery,
      workspace.online,
      workspace.setCompendiumCategory,
      workspace.setCompendiumQuery
    ]
  );
}
