export const DEFAULT_POLICY = {
    'read-only': { autoApprovable: true, ruleGated: false, permitted: true },
    'local-reversible-write': { autoApprovable: false, ruleGated: true, permitted: true },
    'external-reversible-write': { autoApprovable: false, ruleGated: true, permitted: true },
    'external-consequential-write': { autoApprovable: false, ruleGated: false, permitted: true },
    destructive: { autoApprovable: false, ruleGated: false, permitted: true },
};
/**
 * Classify an action into a permission class. The default matrix (§13.1):
 * - read-only may run within granted scopes.
 * - reversible writes may be auto-approved only through an explicit rule.
 * - consequential writes require preview + approval by default.
 * - destructive/irreversible require per-action approval and may be prohibited.
 */
export function classifyAction(action, _args = {}) {
    const a = action.toLowerCase();
    if (a.startsWith('read:') || a.startsWith('search:') || a.startsWith('get:') || a.includes(':read')) {
        return 'read-only';
    }
    if (a.includes('delete') || a.includes('archive') || a.includes('destroy') || a.includes('purge')) {
        return 'destructive';
    }
    if (a.includes('send') ||
        a.includes('create') ||
        a.includes('publish') ||
        a.includes('invite') ||
        a.includes('external')) {
        return 'external-consequential-write';
    }
    if (a.includes('draft') || a.includes('update') || a.includes('label') || a.includes('local')) {
        return 'external-reversible-write';
    }
    return 'local-reversible-write';
}
export function requiresApproval(action, args, explicitRule = false) {
    const cls = classifyAction(action, args);
    const policy = DEFAULT_POLICY[cls];
    if (!policy.permitted)
        return true;
    if (cls === 'read-only')
        return false;
    if (policy.ruleGated)
        return !explicitRule;
    return true;
}
//# sourceMappingURL=permissions.js.map