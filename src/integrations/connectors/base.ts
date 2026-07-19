// Connector base — any external WRITE routes through VFS propose() (action shadowing). PRD §12.4, §13.
import { vfs } from '../../agent/runtime/vfs';
import type { ConnectorScope, ProposalImpact } from '../../core/types';

export abstract class Connector {
  abstract id: string;
  abstract name: string;
  abstract publisher: string;
  abstract version: string;
  abstract scopes: ConnectorScope;

  /** Reads never touch VFS. */
  abstract read(method: string, args: Record<string, unknown>): Promise<unknown>;

  /** External writes are staged through VFS; commit happens only after approval. */
  protected stageWrite(action: string, args: Record<string, unknown>, summary: string, impact: ProposalImpact): string {
    return vfs.propose(action, args, { summary, impact });
  }
}
