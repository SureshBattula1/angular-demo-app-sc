/** Metadata from GET /branches/accessible */
export interface BranchAccessMeta {
  can_select_branch?: boolean;
  user_branch_id?: number | null;
}

export function canShowBranchSelector(meta: BranchAccessMeta): boolean {
  return meta.can_select_branch === true;
}

/**
 * Default branch for forms: locked users get their branch; selectors pick current or first listed.
 */
export function resolveDefaultBranchId(
  meta: BranchAccessMeta,
  branches: { id: string | number }[],
  current?: string | number | null
): string {
  if (canShowBranchSelector(meta)) {
    if (current !== null && current !== undefined && String(current).trim() !== '') {
      return String(current);
    }
    return branches[0] ? String(branches[0].id) : '';
  }

  const locked =
    meta.user_branch_id ??
    (branches.length === 1 ? branches[0]?.id : undefined) ??
    branches[0]?.id;

  return locked !== null && locked !== undefined ? String(locked) : '';
}
