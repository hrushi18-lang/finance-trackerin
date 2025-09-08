// Dummy file to resolve import errors
// This file was deleted but is still being referenced somewhere
export const offlinePersistence = {
  initialize: () => Promise.resolve(),
  setUserId: (userId: string | null) => {},
  getQueueStatus: () => ({ pending: 0, processing: 0, failed: 0 })
};
