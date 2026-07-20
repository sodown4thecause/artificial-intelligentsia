import { useState } from "react";
import type { DocumentSharePermission } from "../../documents/share.js";

export interface DocumentShareDialogProps {
  readonly open: boolean;
  readonly onShare: (userId: string, permission: DocumentSharePermission) => Promise<void> | void;
  readonly onRevoke: (userId: string) => Promise<void> | void;
  readonly sharedUserIds?: readonly string[];
  readonly onClose: () => void;
}

export function DocumentShareDialog({ open, onShare, onRevoke, sharedUserIds = [], onClose }: DocumentShareDialogProps) {
  const [userId, setUserId] = useState("");
  const [permission, setPermission] = useState<DocumentSharePermission>("read");
  if (!open) return null;
  return <section role="dialog" aria-label="Share document">
    <label>User ID <input aria-label="User ID" value={userId} onChange={(event) => setUserId(event.target.value)} /></label>
    <label>Permission <select aria-label="Permission" value={permission} onChange={(event) => setPermission(event.target.value as DocumentSharePermission)}><option value="read">Read</option><option value="write">Write</option></select></label>
    <button type="button" onClick={() => void onShare(userId.trim(), permission)} disabled={!userId.trim()}>Share</button>
    <ul>{sharedUserIds.map((sharedUserId) => <li key={sharedUserId}>{sharedUserId} <button type="button" onClick={() => void onRevoke(sharedUserId)}>Revoke</button></li>)}</ul>
    <button type="button" onClick={onClose}>Close</button>
  </section>;
}
