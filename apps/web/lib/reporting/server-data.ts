export function selectLatestActionableDraft<T extends { id: string }>(
  drafts: readonly T[],
  finalizedDraftIds: readonly (string | null)[],
): T | null {
  const finalized = new Set(finalizedDraftIds.filter((id) => id !== null));
  return drafts.find((draft) => !finalized.has(draft.id)) ?? null;
}
