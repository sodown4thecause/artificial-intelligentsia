import { useCallback, useState } from "react";
import type { GmailDraft, GmailMessage, GmailSearchQuery } from "../../connectors/gmail.js";
import type { MailDraftInput, MailSearchResult, MailThreadSummary } from "../../mail/types.js";
import type { MailService } from "../../mail/service.js";

export interface MailState {
  result?: MailSearchResult;
  selectedThreadId?: string;
  summary?: MailThreadSummary;
  draft?: GmailDraft;
  error?: string;
}

export function useMail(service: MailService): MailState & {
  search(query: GmailSearchQuery): void;
  selectThread(threadId: string): void;
  read(messageId: string): GmailMessage | undefined;
  createDraft(input: MailDraftInput): void;
} {
  const [state, setState] = useState<MailState>({});
  const fail = (error: unknown): void => setState((current) => ({ ...current, error: error instanceof Error ? error.message : "Mail operation failed." }));
  const search = useCallback((query: GmailSearchQuery) => {
    try { setState({ result: service.searchMessages(query) }); } catch (error) { fail(error); }
  }, [service]);
  const selectThread = useCallback((threadId: string) => {
    try { setState((current) => ({ ...current, selectedThreadId: threadId, summary: service.summarizeThread(threadId), error: undefined })); } catch (error) { fail(error); }
  }, [service]);
  const read = useCallback((messageId: string): GmailMessage | undefined => {
    try { return service.readMessage(messageId); } catch (error) { fail(error); return undefined; }
  }, [service]);
  const createDraft = useCallback((input: MailDraftInput) => {
    try { setState((current) => ({ ...current, draft: service.createDraft(input), error: undefined })); } catch (error) { fail(error); }
  }, [service]);
  return { ...state, search, selectThread, read, createDraft };
}
