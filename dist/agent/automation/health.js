export class ConnectorHealthMonitor {
    health = new Map();
    report(id, status, partial = {}) {
        const h = { id, status, scopes: partial.scopes ?? { read: false, write: false, grantedScopes: [] }, ...partial };
        this.health.set(id, h);
        return h;
    }
    get(id) {
        return this.health.get(id);
    }
    reconnect(id) {
        return this.report(id, 'reconnecting');
    }
    expiredTokens() {
        return Array.from(this.health.values()).filter((h) => h.tokenExpiry != null && h.tokenExpiry < Date.now());
    }
}
//# sourceMappingURL=health.js.map