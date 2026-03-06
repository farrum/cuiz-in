/**
 * ADS DISABLED FOR SECURITY
 * All ad syncing has been temporarily disabled to eliminate malicious script injection vectors.
 */
export const useQuizAdSync = (_setForceReloadAds?: React.Dispatch<React.SetStateAction<number>>) => {
  return {
    adsSynced: false,
    syncError: null,
    syncAdSlots: async () => false,
    handleAdSlotsUpdated: () => {}
  };
};
