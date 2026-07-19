export class ConnectorAuth {
    current;
    constructor(initial) {
        this.current = initial;
    }
    /** Detect whether requested scopes expand beyond currently granted; force reauth if so. */
    requestScopes(requested) {
        const added = requested.grantedScopes.filter((s) => !this.current.grantedScopes.includes(s));
        const expanded = requested.write && !this.current.write;
        const requiresReauth = added.length > 0 || expanded;
        if (requiresReauth) {
            return { granted: false, requiresReauth: true, addedScopes: added };
        }
        this.current = requested;
        return { granted: true, requiresReauth: false, addedScopes: [] };
    }
}
//# sourceMappingURL=connectorAuth.js.map