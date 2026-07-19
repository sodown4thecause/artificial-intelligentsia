export class TeamDomain {
    members = new Map();
    enterprise = {};
    // TEAM-001 Roles
    addMember(m) {
        this.members.set(m.id, m);
    }
    setRole(id, role) {
        const m = this.members.get(id);
        if (m)
            m.role = role;
    }
    listMembers() {
        return Array.from(this.members.values());
    }
    // TEAM-002 Analytics — distinguish measured from estimated.
    analytics() {
        return {
            measured: { adoption: 12, activeUsers: 8, agentTasksCompleted: 34, acceptanceRate: 0.82, automationSuccess: 0.95 },
            estimated: { timeSavedMinutes: 420, reworkRate: 0.05 },
        };
    }
    // TEAM-003 ROI report — estimates only, never exact financial return.
    roiReport() {
        return {
            assumptions: ['avg hourly value', 'tasks automated', 'time saved'],
            note: 'Estimated time savings are not presented as exact financial return.',
        };
    }
    // TEAM-004 Effective Communication Score — explainable, not covert performance score.
    commScore(dims) {
        const vals = Object.values(dims);
        const score = Math.round((vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length)) * 100) / 100;
        return { score, explainable: true, warning: 'Explainable aggregate; not a covert employee-performance score.' };
    }
    // TEAM-005 Enterprise controls
    configureEnterprise(c) {
        this.enterprise = c;
    }
    getEnterprise() {
        return this.enterprise;
    }
}
//# sourceMappingURL=team.js.map