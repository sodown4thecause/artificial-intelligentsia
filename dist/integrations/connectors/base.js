// Connector base — any external WRITE routes through VFS propose() (action shadowing). PRD §12.4, §13.
import { vfs } from '../../agent/runtime/vfs';
export class Connector {
    /** External writes are staged through VFS; commit happens only after approval. */
    stageWrite(action, args, summary, impact) {
        return vfs.propose(action, args, { summary, impact });
    }
}
//# sourceMappingURL=base.js.map